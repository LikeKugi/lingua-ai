"use client";

import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";
import { dateLabel, languageLabel, type HistoryItem } from "../lib";
import type { Toast } from "./types";

interface HistoryPageProps {
  history: HistoryItem[];
  setHistory: Dispatch<SetStateAction<HistoryItem[]>>;
  setSelectedHistory: Dispatch<SetStateAction<HistoryItem | null>>;
  showToast: (text: string, kind?: Toast["kind"]) => void;
}

export default function HistoryPage({
  history,
  setHistory,
  setSelectedHistory,
  showToast,
}: HistoryPageProps) {
  return (
    <section className="history-list" aria-label="Сохранённые разборы">
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
                <span className="type-badge">{ item.taskType === "words" ? "СЛОВА" : "ПРЕДЛОЖЕНИЕ" }</span>
                <time>{ dateLabel(item.createdAt) }</time>
              </div>
              <h2>{ Array.isArray(item.task) ? item.task.filter(Boolean).join(" · ") : item.task }</h2>
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
    </section>
  );
}
