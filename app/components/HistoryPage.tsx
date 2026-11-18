"use client";

import Link from "next/link";
import { type ChangeEvent, type Dispatch, type SetStateAction, useRef, useState } from "react";
import { dateLabel, languageLabel, taskToText, isWordsTask, isSentenceTask, isPasteBlankTask, isTestTask, type HistoryItem, type TaskType } from "../lib";
import type { Toast } from "./types";
import { useI18n, taskTypeName } from "../i18n";

interface HistoryPageProps {
  history: HistoryItem[];
  setHistory: Dispatch<SetStateAction<HistoryItem[]>>;
  setSelectedHistory: Dispatch<SetStateAction<HistoryItem | null>>;
  onPracticeItem: (id: string) => void;
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
    (typeof record.task === "string" || Array.isArray(record.task) || (typeof record.task === "object" && record.task !== null && (("words" in record.task && Array.isArray((record.task as Record<string, unknown>).words)) || ("text" in record.task && Array.isArray((record.task as Record<string, unknown>).variants))))) &&
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
  onPracticeItem,
  showToast,
}: HistoryPageProps) {
  const { t, locale } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<HistoryItem[] | null>(null);
  const [markUnpracticed, setMarkUnpracticed] = useState(false);

  const closeImport = () => {
    setPendingImport(null);
    setMarkUnpracticed(false);
  };

  const exportHistory = () => {
    if (history.length === 0) {
      showToast(t.history.exportEmpty, "info");
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
    showToast(t.history.exported, "success");
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
          showToast(t.history.importNoItems, "info");
          return;
        }
        setPendingImport(items.map((item) => ({ ...item, isPracticed: item.isPracticed ?? false })));
        setMarkUnpracticed(false);
      } catch {
        showToast(t.history.importReadError, "error");
      }
    };
    reader.onerror = () => {
      showToast(t.history.importFileError, "error");
    };
    reader.readAsText(file);
  };

  const extendHistory = (incoming: HistoryItem[]) => {
    const items = markUnpracticed
      ? incoming.map((item) => ({ ...item, isPracticed: false }))
      : incoming;
    const byId = new Map<string, HistoryItem>();
    for (const item of history) byId.set(item.id, item);
    // Imported records win on id collision.
    for (const item of items) byId.set(item.id, item);
    const merged = sortByDateDesc(Array.from(byId.values()));
    setHistory(merged);
    setSelectedHistory(null);
    closeImport();
    showToast(t.history.importMerged(incoming.length, merged.length), "success");
  };

  const replaceHistory = (incoming: HistoryItem[]) => {
    const items = markUnpracticed
      ? incoming.map((item) => ({ ...item, isPracticed: false }))
      : incoming;
    const replaced = sortByDateDesc(items);
    setHistory(replaced);
    setSelectedHistory(null);
    closeImport();
    showToast(t.history.importReplaced(replaced.length), "success");
  };

  return (
    <section className="history-list" aria-label={ t.history.listAria }>
      <div className="history-toolbar">
        <button
          type="button"
          className="button button-outline button-small"
          onClick={ exportHistory }
          disabled={ history.length === 0 }
        >{ t.history.exportBtn }
        </button>
        <button
          type="button"
          className="button button-outline button-small"
          onClick={ () => fileInputRef.current?.click() }
        >{ t.history.importBtn }
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
          <h2>{ t.history.emptyTitle }</h2>
          <p>{ t.history.emptyText }</p>
          <Link className="button button-primary" href="/">{ t.common.startExplain } <span className="button-arrow">↗</span></Link>
        </div>
      ) : (
        history.map((item) => (
          <article key={ item.id } className="history-card workspace-card">
            <button
              className="history-open"
              onClick={ () => setSelectedHistory(item) }
              aria-label={ t.history.openAria(dateLabel(item.createdAt, locale)) }
            >
              <div className="history-card-top">
                <span className="type-badge">{ taskTypeName(t, item.taskType).toLocaleUpperCase(locale) }</span>
                { item.isPracticed && <span className="practiced-badge">{ t.common.practiced }</span> }
                <time>{ dateLabel(item.createdAt, locale) }</time>
              </div>
              <h2>{ taskToText(item.task) }</h2>
              <p className="history-answer"><span>{ t.labels.yourResponse }</span> { item.userAnswer }</p>
              <p className="history-preview">
                { item.response.replace(/[#*_`]/g, "").slice(0, 190) }{ item.response.length > 190 ? "…" : "" }
              </p>
            </button>
            <div className="history-card-bottom">
              <span>{ item.model } · { languageLabel(item.language) }</span>
              <span className="history-actions">
                <button type="button" className="button button-outline button-small" onClick={ () => setSelectedHistory(item) }>{ t.history.open } ↗</button>
                <button type="button" className="button button-soft button-small" onClick={ () => onPracticeItem(item.id) } aria-label={ t.history.practiceAria }>{ t.history.practice }</button>
              </span>
            </div>
            <button
              className="icon-button history-delete"
              onClick={ () => {
                if (window.confirm(t.history.confirmDelete)) {
                  setHistory((current) => current.filter((record) => record.id !== item.id));
                  showToast(t.history.deleted, "success");
                }
              } }
              aria-label={ t.history.deleteAria }
            >×
            </button>
          </article>
        ))
      ) }
      { pendingImport && (
        <div
          className="modal-backdrop"
          onMouseDown={ (event) => { if (event.target === event.currentTarget) closeImport(); } }
        >
          <section
            className="history-modal workspace-card import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
          >
            <div className="modal-head">
              <div>
                <span className="type-badge">{ t.history.importTag }</span>
                <h2 id="import-modal-title">{ t.history.importTitle }</h2>
                <p className="page-lede">{ t.history.importFoundCount(pendingImport.length) }</p>
              </div>
            </div>
            <label className="import-option">
              <input
                type="checkbox"
                checked={ markUnpracticed }
                onChange={ () => setMarkUnpracticed((value) => !value) }
              />
              <span>
                <span className="import-option-title">{ t.history.unmarkTitle }</span>
                <span className="import-option-hint">{ t.history.unmarkHint }</span>
              </span>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button button-soft"
                onClick={ () => extendHistory(pendingImport) }
              >{ t.history.mergeBtn }
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={ () => replaceHistory(pendingImport) }
              >{ t.history.replaceBtn }
              </button>
              <button
                type="button"
                className="button button-outline"
                onClick={ () => closeImport() }
              >{ t.common.cancel }
              </button>
            </div>
          </section>
        </div>
      ) }
    </section>
  );
}
