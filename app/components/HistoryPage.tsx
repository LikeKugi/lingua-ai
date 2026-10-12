"use client";

import Link from "next/link";
import { type ChangeEvent, type Dispatch, type SetStateAction, useRef, useState } from "react";
import { dateLabel, languageLabel, taskToText, isWordsTask, isSentenceTask, isPasteBlankTask, isTestTask, type HistoryItem, type TaskType } from "../lib";
import type { Toast } from "./types";

interface HistoryPageProps {
  history: HistoryItem[];
  setHistory: Dispatch<SetStateAction<HistoryItem[]>>;
  setSelectedHistory: Dispatch<SetStateAction<HistoryItem | null>>;
  showToast: (text: string, kind?: Toast["kind"]) => void;
}

const sortByDateDesc = (items: HistoryItem[]): HistoryItem[] =>
  [...items].sort((a, b) => b.createdAt - a.createdAt);

const isHistoryItem = (value: unknown): value is HistoryItem => {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.createdAt === "number" &&
    (isWordsTask(record.taskType as TaskType) || isSentenceTask(record.taskType as TaskType) || isPasteBlankTask(record.taskType as TaskType) || isTestTask(record.taskType as TaskType)) &&
    (typeof record.task === "string" || Array.isArray(record.task) || (typeof record.task === "object" && record.task !== null && "text" in record.task && Array.isArray((record.task as Record<string, unknown>).variants))) &&
    typeof record.userAnswer === "string" &&
    typeof record.correctAnswer === "string" &&
    typeof record.response === "string" &&
    typeof record.model === "string" &&
    typeof record.language === "string"
  );
};

export default function HistoryPage({
  history,
  setHistory,
  setSelectedHistory,
  showToast,
}: HistoryPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<HistoryItem[] | null>(null);

  const exportHistory = () => {
    if (history.length === 0) {
      showToast("Нечего выгружать: история пуста.", "info");
      return;
    }
    const payload = {
      version: 1,
      type: "lingva-history",
      exportedAt: Date.now(),
      items: history,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lingva-history-${stamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("История выгружена в файл.", "success");
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so selecting the same file again still triggers onChange.
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const items: unknown = Array.isArray(parsed) ? parsed : parsed?.items;
        if (!Array.isArray(items) || !items.every(isHistoryItem)) {
          throw new Error("bad-shape");
        }
        if (items.length === 0) {
          showToast("Файл не содержит разборов.", "info");
          return;
        }
        setPendingImport(items.map((item) => ({ ...item, isPracticed: item.isPracticed ?? false })));
      } catch {
        showToast("Не удалось прочитать файл. Проверьте, что это корректный экспорт истории.", "error");
      }
    };
    reader.onerror = () => {
      showToast("Не удалось прочитать файл.", "error");
    };
    reader.readAsText(file);
  };

  const extendHistory = (incoming: HistoryItem[]) => {
    const byId = new Map<string, HistoryItem>();
    for (const item of history) byId.set(item.id, item);
    // Imported records win on id collision.
    for (const item of incoming) byId.set(item.id, item);
    const merged = sortByDateDesc(Array.from(byId.values()));
    setHistory(merged);
    setSelectedHistory(null);
    setPendingImport(null);
    showToast(`Импортировано разборов: ${incoming.length}. Всего в истории: ${merged.length}.`, "success");
  };

  const replaceHistory = (incoming: HistoryItem[]) => {
    const replaced = sortByDateDesc(incoming);
    setHistory(replaced);
    setSelectedHistory(null);
    setPendingImport(null);
    showToast(`История заменена. Загружено разборов: ${replaced.length}.`, "success");
  };

  return (
    <section className="history-list" aria-label="Сохранённые разборы">
      <div className="history-toolbar">
        <button
          type="button"
          className="button button-outline button-small"
          onClick={ exportHistory }
          disabled={ history.length === 0 }
        >Экспорт
        </button>
        <button
          type="button"
          className="button button-outline button-small"
          onClick={ () => fileInputRef.current?.click() }
        >Импорт
        </button>
        <input
          ref={ fileInputRef }
          type="file"
          accept="application/json,.json"
          onChange={ handleFile }
          hidden
        />
      </div>
      { history.length === 0 ? (
        <div className="empty-state workspace-card">
          <span className="empty-illustration" aria-hidden="true">↗</span>
          <h2>Здесь появятся ваши разборы</h2>
          <p>После первого объяснения вы сможете вернуться к нему в любое время. Записи хранятся только в этом браузере.</p>
          <Link className="button button-primary" href="/">Начать разбор <span className="button-arrow">↗</span></Link>
        </div>
      ) : (
        history.map((item) => (
          <article key={ item.id } className="history-card workspace-card">
            <button
              className="history-open"
              onClick={ () => setSelectedHistory(item) }
              aria-label={ `Открыть разбор от ${ dateLabel(item.createdAt) }` }
            >
              <div className="history-card-top">
                <span className="type-badge">{ isWordsTask(item.taskType) ? "СЛОВА" : isPasteBlankTask(item.taskType) ? "ПРОПУСКИ" : isTestTask(item.taskType) ? "ТЕСТ" : "ПРЕДЛОЖЕНИЕ" }</span>
                <time>{ dateLabel(item.createdAt) }</time>
              </div>
              <h2>{ taskToText(item.task) }</h2>
              <p className="history-answer"><span>ВАШ ОТВЕТ</span> { item.userAnswer }</p>
              <p className="history-preview">
                { item.response.replace(/[#*_`]/g, "").slice(0, 190) }{ item.response.length > 190 ? "…" : "" }
              </p>
              <div className="history-card-bottom">
                <span>{ item.model } · { languageLabel(item.language) }</span>
                <span className="open-arrow">Открыть ↗</span>
              </div>
            </button>
            <button
              className="icon-button history-delete"
              onClick={ () => {
                if (window.confirm("Удалить этот разбор из истории?")) {
                  setHistory((current) => current.filter((record) => record.id !== item.id));
                  showToast("Разбор удалён.", "success");
                }
              } }
              aria-label="Удалить разбор"
            >×
            </button>
          </article>
        ))
      ) }
      { pendingImport && (
        <div
          className="modal-backdrop"
          onMouseDown={ (event) => { if (event.target === event.currentTarget) setPendingImport(null); } }
        >
          <section
            className="history-modal workspace-card import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
          >
            <div className="modal-head">
              <div>
                <span className="type-badge">ИМПОРТ</span>
                <h2 id="import-modal-title">Импорт разборов</h2>
                <p className="page-lede">Найдено разборов: { pendingImport.length }. Как поступить с ними?</p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-soft"
                onClick={ () => extendHistory(pendingImport) }
              >Дополнить мои разборы
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={ () => replaceHistory(pendingImport) }
              >Заменить текущие
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={ () => setPendingImport(null) }
              >Отмена
              </button>
            </div>
          </section>
        </div>
      ) }
    </section>
  );
}
