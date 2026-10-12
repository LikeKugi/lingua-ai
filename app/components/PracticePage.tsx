"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ANY_PRACTICE_TYPES,
  describeTheme,
  taskToText,
  taskTypeLabel,
  type HistoryItem,
  type PracticeIssue,
  type PracticeMode,
  type Settings,
  type TaskType,
} from "../lib";
import type { Toast } from "./types";
import { Field } from "./ui";

interface PracticePageProps {
  initialItemId: string | null;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  settings: Settings;
  apiKey: string;
  online: boolean;
  showToast: (text: string, kind?: Toast["kind"]) => void;
}

type Step = "setup" | "practice" | "result";
type CheckResult = { index: number; correct: boolean; comment: string };

function providerError(status: number, code?: string): string {
  if (code === "invalid_url") return "Укажите корректный адрес сервиса, начинающийся с http:// или https://.";
  if (code === "missing_key") return "Введите ключ API перед отправкой.";
  if (code === "missing_model") return "Выберите модель в настройках.";
  if (status === 401) return "Сервис отклонил ключ. Проверьте его и попробуйте снова.";
  if (status === 404) return "Сервис не нашёл адрес моделей или выбранную модель.";
  if (code === "timeout") return "Сервис не ответил вовремя. Проверьте соединение и повторите попытку.";
  if (code === "network") return "Не удалось связаться с сервисом. Проверьте интернет и адрес.";
  if (code === "empty_response") return "Модель вернула пустой ответ. Попробуйте другую модель.";
  return "Запрос не выполнен. Проверьте адрес, ключ и настройки модели.";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if ("safeMessage" in error) return String((error as { safeMessage: unknown }).safeMessage);
    if (error.name === "TimeoutError") return providerError(0, "timeout");
    if (error instanceof SyntaxError) return "Модель вернула ответ в неожиданном формате. Попробуйте ещё раз.";
    return providerError(0, "network");
  }
  return "Не удалось выполнить запрос.";
}

function extractJson(text: string): string {
  let value = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(value);
  if (fence) value = fence[1].trim();
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start >= 0 && end > start) value = value.slice(start, end + 1);
  return value;
}

function normalizeIssue(raw: Record<string, unknown>, index: number): PracticeIssue | null {
  const kind = raw.kind;
  if (kind === "sentence") {
    return { kind, prompt: String(raw.prompt ?? "").trim() || `Задание ${index + 1}`, correct: String(raw.correct ?? "").trim() };
  }
  if (kind === "words") {
    const words = Array.isArray(raw.words) ? raw.words.map(String).filter(Boolean) : [];
    return { kind, words, correct: String(raw.correct ?? "").trim() };
  }
  if (kind === "paste-blank") {
    const blanks = Array.isArray(raw.blanks) ? raw.blanks.map(String) : [];
    return { kind, text: String(raw.text ?? "").trim(), blanks };
  }
  if (kind === "test") {
    const variants = Array.isArray(raw.variants) ? raw.variants.map(String).filter((variant) => variant.trim()) : [];
    let correctIndex = Number(raw.correctIndex);
    if (!Number.isFinite(correctIndex) || correctIndex < 0 || correctIndex >= variants.length) correctIndex = 0;
    return { kind, question: String(raw.question ?? "").trim() || `Вопрос ${index + 1}`, variants, correctIndex };
  }
  return null;
}

function parseIssues(text: string): PracticeIssue[] {
  const parsed = JSON.parse(extractJson(text)) as { issues?: unknown[] };
  if (!parsed || !Array.isArray(parsed.issues)) throw new Error("bad-shape");
  const issues = parsed.issues
    .map((raw, index) => normalizeIssue(raw as Record<string, unknown>, index))
    .filter((issue): issue is PracticeIssue => issue !== null);
  if (!issues.length) throw new Error("empty");
  return issues;
}

function parseResults(text: string): CheckResult[] {
  const parsed = JSON.parse(extractJson(text)) as { results?: unknown[] };
  const rows = Array.isArray(parsed.results) ? parsed.results : [];
  return rows.map((raw) => {
    const row = raw as { index?: unknown; correct?: unknown; comment?: unknown };
    return { index: Number(row.index), correct: row.correct === true, comment: String(row.comment ?? "") };
  });
}

function blankParts(text: string): string[] {
  return text.split(/_{3,}/);
}

function buildGenerateMessages(item: HistoryItem, allowed: TaskType[]): { role: string; content: string }[] {
  const typeList = allowed.map((type) => taskTypeLabel(type)).join(", ");
  const forms = allowed
    .map((type) => {
      if (type === "sentence") return '- Предложение (sentence): {"kind":"sentence","prompt":"текст задания на языке темы","correct":"правильный ответ"}';
      if (type === "words") return '- Слова (words): {"kind":"words","words":["слово1","слово2"],"correct":"правильное предложение"}';
      if (type === "paste-blank") return '- Пропуски (paste-blank): {"kind":"paste-blank","text":"предложение, где пропуски обозначены тремя подчёркиваниями ___ ","blanks":["вставить1","вставить2"]}';
      return '- Тест (test): {"kind":"test","question":"вопрос","variants":["вариант1","вариант2","вариант3"],"correctIndex":0}';
    })
    .join("\n");
  const system = `Ты — опытный преподаватель иностранных языков. Твоя задача — составить тренировочные задания, которые помогают учащемуся закрепить правило, на котором он недавно ошибся. Отвечай СТРОГО валидным JSON без пояснений, без Markdown и без обёртки в блок кода. Структура ответа:
{
  "issues": [ ... ]
}
В массиве issues должно быть ровно 10 заданий. Допустимые типы заданий: ${typeList}.`;
  const user = `Тема для тренировки (оригинальное задание учащегося, его ошибочный ответ, правильный ответ и разбор ошибки):
${describeTheme(item)}

Сгенерируй 10 заданий. Разрешённые типы: ${typeList}.
Для каждого задания используй одну из форм:
${forms}

Сделай задания разнообразными, на одну и ту же тему, полезными для закрепления правила. Возвращай только JSON.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function issueCheckText(issue: PracticeIssue, index: number, answer: string[]): string {
  const header = `Задание ${index} (${taskTypeLabel(issue.kind)}):`;
  switch (issue.kind) {
    case "sentence":
      return `${header}\nЗадание: ${issue.prompt}\nПравильный ответ: ${issue.correct}\nОтвет учащегося: ${answer[0] ?? ""}`;
    case "words":
      return `${header}\nСлова: ${issue.words.join(", ")}\nПравильный ответ: ${issue.correct}\nОтвет учащегося: ${answer[0] ?? ""}`;
    case "paste-blank":
      return `${header}\nТекст: ${issue.text}\nПравильные вставки (по порядку): ${issue.blanks.join(", ")}\nОтветы учащегося (по порядку): ${answer.join(" | ")}`;
    case "test":
      return `${header}\nВопрос: ${issue.question}\nВарианты:\n${issue.variants.map((variant, variantIndex) => `${variantIndex}) ${variant}`).join("\n")}\nПравильный вариант: ${issue.correctIndex} (${issue.variants[issue.correctIndex]})\nВыбор учащегося (индекс): ${answer[0] ?? ""}`;
  }
}

function buildCheckMessages(issues: PracticeIssue[], answers: string[][]): { role: string; content: string }[] {
  const system = `Ты — опытный преподаватель иностранных языков. Проверь ответы учащегося на тренировочные задания. Отвечай СТРОГО валидным JSON без пояснений, без Markdown и без обёртки в блок кода. Структура ответа:
{
  "results": [
    {"index":0,"correct":true,"comment":""}
  ]
}
Поле index — номер задания, начиная с 0. Поле correct — верен ли ответ (true/false). Поле comment — краткое пояснение на русском, если ответ неверен (иначе пустая строка).`;
  const user = `Вот задания, правильные ответы и ответы учащегося. Проверь каждый ответ и верни JSON с результатами.

${issues.map((issue, index) => issueCheckText(issue, index, answers[index] ?? [])).join("\n\n")}

Верни JSON с ровно ${issues.length} результатами, индексы от 0 до ${issues.length - 1}.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function learnerAnswerText(issue: PracticeIssue, answer: string[]): string {
  if (issue.kind === "test") {
    const chosen = Number(answer[0]);
    return Number.isFinite(chosen) && issue.variants[chosen] ? issue.variants[chosen] : "—";
  }
  if (issue.kind === "paste-blank") return answer.join(", ");
  return answer[0] ?? "";
}

export default function PracticePage({
  initialItemId,
  history,
  setHistory,
  settings,
  apiKey,
  online,
  showToast,
}: PracticePageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId);
  const [mode, setMode] = useState<PracticeMode>("same");
  const [step, setStep] = useState<Step>("setup");
  const [issues, setIssues] = useState<PracticeIssue[]>([]);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [busy, setBusy] = useState<"generate" | "check" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialItemId) setSelectedId(initialItemId);
  }, [initialItemId]);

  const sortedHistory = useMemo(() => [...history].sort((a, b) => b.createdAt - a.createdAt), [history]);
  const selectedItem = useMemo(
    () => history.find((item) => item.id === selectedId) ?? sortedHistory[0] ?? null,
    [history, selectedId, sortedHistory],
  );

  const allowedTypes: TaskType[] =
    mode === "same" && selectedItem ? [selectedItem.taskType] : ANY_PRACTICE_TYPES;

  const configMissing: string[] = [];
  if (!apiKey.trim()) configMissing.push("ключ API");
  if (!settings.baseUrl.trim()) configMissing.push("адрес сервиса");
  if (!settings.model.trim()) configMissing.push("модель");

  const setAnswer = (index: number, value: string, blankIndex = 0) => {
    setAnswers((prev) => {
      const next = prev.map((row) => row.slice());
      if (!next[index]) next[index] = [];
      next[index][blankIndex] = value;
      return next;
    });
  };

  const allAnswered = () =>
    issues.every((issue, index) => {
      const answer = answers[index] ?? [];
      return answer.length > 0 && answer.every((value) => value.trim() !== "");
    });

  const callPractice = async (messages: { role: string; content: string }[], temperature = 0.4): Promise<string> => {
    const response = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey, model: settings.model, messages, temperature }),
      signal: AbortSignal.timeout(90000),
      cache: "no-store",
    });
    const data = (await response.json()) as { response?: string; error?: string; code?: string };
    if (!response.ok) throw Object.assign(new Error(providerError(response.status, data.code)), { safeMessage: providerError(response.status, data.code) });
    if (!data.response?.trim()) throw Object.assign(new Error(providerError(0, "empty_response")), { safeMessage: providerError(0, "empty_response") });
    return data.response;
  };

  const generate = async () => {
    if (!selectedItem || busy || !online || configMissing.length) return;
    setBusy("generate");
    setError("");
    setResults(null);
    try {
      const response = await callPractice(buildGenerateMessages(selectedItem, allowedTypes), 0.6);
      const parsed = parseIssues(response);
      setIssues(parsed);
      setAnswers(parsed.map((issue) => (issue.kind === "paste-blank" ? issue.blanks.map(() => "") : [""])));
      setStep("practice");
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(null);
    }
  };

  const check = async () => {
    if (busy || !online) return;
    if (!allAnswered()) {
      setError("Ответьте на все задания, прежде чем проверять.");
      return;
    }
    setBusy("check");
    setError("");
    try {
      const response = await callPractice(buildCheckMessages(issues, answers), 0.2);
      const parsed = parseResults(response);
      setResults(parsed);
      const correctCount = parsed.filter((row) => row.correct).length;
      const allCorrect = correctCount === issues.length;
      if (allCorrect) {
        if (selectedItem && !selectedItem.isPracticed) {
          setHistory((prev) => prev.map((item) => (item.id === selectedItem.id ? { ...item, isPracticed: true } : item)));
          showToast("Все задания верны — тема отмечена как отработанная.", "success");
        } else {
          showToast("Все задания верны!", "success");
        }
      } else {
        showToast(`Верно ${correctCount} из ${issues.length}. Проверьте пояснения и попробуйте исправить.`, "info");
      }
      setStep("result");
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      showToast(message, "error");
    } finally {
      setBusy(null);
    }
  };

  if (history.length === 0) {
    return (
      <section className="practice-page">
        <div className="empty-state workspace-card">
          <span className="empty-illustration" aria-hidden="true">✳</span>
          <h2>Нет тем для тренировки</h2>
          <p>Сначала разберите ошибку в разделе «Разбор». Сохранённые разборы станут темами для практики.</p>
          <Link className="button button-primary" href="/">Начать разбор <span className="button-arrow">↗</span></Link>
        </div>
      </section>
    );
  }

  const resultByIndex = new Map<number, CheckResult>((results ?? []).map((row) => [row.index, row]));

  return (
    <section className="practice-page">
      {step === "setup" && (
        <div className="practice-setup">
          <Field label="Тема для тренировки">
            <select
              className="text-input theme-select"
              value={selectedItem?.id ?? ""}
              onChange={(event) => setSelectedId(event.target.value || null)}
            >
              {sortedHistory.map((item) => (
                <option key={item.id} value={item.id}>
                  {taskTypeLabel(item.taskType)} · {taskToText(item.task).slice(0, 60)}
                </option>
              ))}
            </select>
          </Field>

          {selectedItem && (
            <div className="workspace-card theme-card">
              <div className="history-card-top">
                <span className="type-badge">{taskTypeLabel(selectedItem.taskType).toLocaleUpperCase("ru-RU")}</span>
                {selectedItem.isPracticed && <span className="practiced-badge">отработано</span>}
              </div>
              <div className="theme-fields">
                <div><span>ЗАДАНИЕ</span><p>{taskToText(selectedItem.task)}</p></div>
                <div><span>ВАШ ОТВЕТ</span><p>{selectedItem.userAnswer}</p></div>
                <div><span>ПРАВИЛЬНО</span><p>{selectedItem.correctAnswer}</p></div>
              </div>
            </div>
          )}

          <div className="mode-switch" role="radiogroup" aria-label="Тип заданий для практики">
            <button
              type="button"
              role="radio"
              aria-checked={mode === "same"}
              className={mode === "same" ? "selected" : ""}
              onClick={() => setMode("same")}
            >
              Тот же тип{selectedItem ? ` (${taskTypeLabel(selectedItem.taskType)})` : ""}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "any"}
              className={mode === "any" ? "selected" : ""}
              onClick={() => setMode("any")}
            >
              Любой доступный
            </button>
          </div>
          <p className="allowed-note">
            {mode === "same"
              ? `Задания будут того же типа: ${taskTypeLabel(selectedItem?.taskType ?? "sentence")}.`
              : "Задания могут быть любого из типов: Предложение, Пропуски, Тест."}
          </p>

          {configMissing.length > 0 && (
            <div className="missing-note">
              <span className="missing-mark" aria-hidden="true">i</span>
              <span>Чтобы тренироваться, добавьте {configMissing.join(", ")}. <Link href="/settings">Открыть настройки</Link>.</span>
            </div>
          )}
          {!online && (
            <div className="inline-alert" role="status">Сейчас нет интернета. Тренировку можно начать после подключения.</div>
          )}
          {error && <div className="inline-alert" role="alert">{error}</div>}

          <div className="submit-row">
            <button
              className="button button-primary"
              type="button"
              onClick={generate}
              disabled={Boolean(busy) || !online || configMissing.length > 0 || !selectedItem}
            >
              <span>{busy === "generate" ? "Составляем задания…" : "Создать 10 заданий"}</span>
              <span className="button-arrow" aria-hidden="true">↗</span>
            </button>
          </div>
          {busy === "generate" && (
            <div className="loading-card" role="status">
              <span className="loader" />
              <span>
                <b>Готовим тренировку</b>
                <small>Модель составляет 10 заданий по выбранной теме…</small>
              </span>
            </div>
          )}
        </div>
      )}

      {step === "practice" && (
        <div className="practice-run">
          <p className="page-lede">Ответьте на 10 заданий по теме «{selectedItem ? taskToText(selectedItem.task).slice(0, 80) : ""}».</p>
          <div className="issue-list">
            {issues.map((issue, index) => (
              <article key={index} className="workspace-card issue-card">
                <div className="issue-head">
                  <span className="issue-num">{index + 1}</span>
                  <span className="type-badge">{taskTypeLabel(issue.kind).toLocaleUpperCase("ru-RU")}</span>
                </div>
                {issue.kind === "sentence" && (
                  <Field label="Переведите или переделайте">
                    <p className="issue-prompt">{issue.prompt}</p>
                    <textarea
                      className="text-area"
                      rows={2}
                      value={answers[index]?.[0] ?? ""}
                      onChange={(event) => setAnswer(index, event.target.value)}
                      placeholder="Ваш ответ…"
                    />
                  </Field>
                )}
                {issue.kind === "words" && (
                  <Field label="Составьте предложение из слов">
                    <div className="word-chips">
                      {issue.words.map((word, wordIndex) => (
                        <span className="chip" key={wordIndex}>{word}</span>
                      ))}
                    </div>
                    <textarea
                      className="text-area"
                      rows={2}
                      value={answers[index]?.[0] ?? ""}
                      onChange={(event) => setAnswer(index, event.target.value)}
                      placeholder="Ваше предложение…"
                    />
                  </Field>
                )}
                {issue.kind === "paste-blank" && (() => {
                  const parts = blankParts(issue.text);
                  const blankCount = Math.min(parts.length - 1, issue.blanks.length);
                  return (
                    <Field label="Вставьте пропущенные слова">
                      <p className="issue-prompt">
                        {parts.map((part, partIndex) => (
                          <Fragment key={partIndex}>
                            {part}
                            {partIndex < blankCount && (
                              <input
                                className="blank-input text-input"
                                value={answers[index]?.[partIndex] ?? ""}
                                onChange={(event) => setAnswer(index, event.target.value, partIndex)}
                                aria-label={`Пропуск ${partIndex + 1}`}
                              />
                            )}
                          </Fragment>
                        ))}
                      </p>
                    </Field>
                  );
                })()}
                {issue.kind === "test" && (
                  <Field label="Выберите верный вариант">
                    <p className="issue-prompt">{issue.question}</p>
                    <div className="option-list" role="radiogroup" aria-label={`Варианты задания ${index + 1}`}>
                      {issue.variants.map((variant, variantIndex) => (
                        <label
                          key={variantIndex}
                          className={`option-row ${answers[index]?.[0] === String(variantIndex) ? "selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name={`practice-q-${index}`}
                            value={variantIndex}
                            checked={answers[index]?.[0] === String(variantIndex)}
                            onChange={() => setAnswer(index, String(variantIndex))}
                          />
                          <span>{variant}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                )}
              </article>
            ))}
          </div>

          {error && <div className="inline-alert" role="alert">{error}</div>}
          {busy === "check" && (
            <div className="loading-card" role="status">
              <span className="loader" />
              <span>
                <b>Проверяем ответы</b>
                <small>Модель сверяет ваши ответы с правильными…</small>
              </span>
            </div>
          )}

          <div className="submit-row practice-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={check}
              disabled={Boolean(busy) || !online}
            >
              <span>{busy === "check" ? "Проверяем…" : "Проверить ответы"}</span>
              <span className="button-arrow" aria-hidden="true">↗</span>
            </button>
            <button className="button button-outline" type="button" onClick={() => setStep("setup")} disabled={Boolean(busy)}>
              Сменить тему
            </button>
          </div>
        </div>
      )}

      {step === "result" && results && (
        <div className="practice-result">
          {(() => {
            const correctCount = results.filter((row) => row.correct).length;
            const allCorrect = correctCount === issues.length;
            return (
              <div className={`workspace-card score-card ${allCorrect ? "score-correct" : "score-partial"}`}>
                <h2>{allCorrect ? "Тема отработана" : `Верно ${correctCount} из ${issues.length}`}</h2>
                <p>{allCorrect ? "Все задания выполнены верно. Можно брать следующую тему." : "Разберите пояснения ниже и попробуйте пройти снова."}</p>
              </div>
            );
          })()}

          <div className="issue-list">
            {issues.map((issue, index) => {
              const row = resultByIndex.get(index);
              const correct = row?.correct ?? false;
              return (
                <article key={index} className="workspace-card issue-card result-issue">
                  <div className="issue-head">
                    <span className="issue-num">{index + 1}</span>
                    <span className="type-badge">{taskTypeLabel(issue.kind).toLocaleUpperCase("ru-RU")}</span>
                    <span className={correct ? "correct-mark" : "wrong-mark"} aria-hidden="true">{correct ? "✓" : "!"}</span>
                  </div>
                  <p className="issue-prompt">{issue.kind === "test" ? issue.question : issue.kind === "words" ? issue.words.join(" + ") : issue.kind === "paste-blank" ? issue.text : issue.prompt}</p>
                  <div className="answer-feedback">
                    <div><span>ВАШ ОТВЕТ</span><p>{learnerAnswerText(issue, answers[index] ?? [])}</p></div>
                    {!correct && <div><span>ПРАВИЛЬНО</span><p>{issue.kind === "test" ? issue.variants[issue.correctIndex] : issue.kind === "paste-blank" ? issue.blanks.join(", ") : issue.correct}</p></div>}
                  </div>
                  {row?.comment && <p className="feedback-comment">{row.comment}</p>}
                </article>
              );
            })}
          </div>

          <div className="submit-row practice-actions">
            <button className="button button-primary" type="button" onClick={generate} disabled={Boolean(busy) || !online}>
              <span>{busy === "generate" ? "Составляем…" : "Новые задания"}</span>
              <span className="button-arrow" aria-hidden="true">↗</span>
            </button>
            <button className="button button-outline" type="button" onClick={() => setStep("setup")} disabled={Boolean(busy)}>
              Другая тема
            </button>
            <Link className="button button-soft" href="/history">К истории</Link>
          </div>
          {busy === "generate" && (
            <div className="loading-card" role="status">
              <span className="loader" />
              <span>
                <b>Готовим тренировку</b>
                <small>Модель составляет 10 заданий по выбранной теме…</small>
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
