"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { dateLabel, languageLabel, type HistoryItem, type TaskType } from "../lib";
import { Field, Markdown } from "./ui";
import { isDraftSentence, isDraftWords, isDraftPasteBlank, isDraftTest, type Draft } from "./types";

interface ExplainPageProps {
  draft: Draft;
  online: boolean;
  apiKey: string;
  model: string;
  missing: string[];
  requestBusy: boolean;
  explanation: HistoryItem | null;
  explanationError: string;
  updateDraft: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  changeTaskType: (taskType: TaskType) => void;
  explain: (event: FormEvent) => void;
  clearDraft: () => void;
  startNextExplanation: () => void;
}

export default function ExplainPage({
  draft,
  online,
  apiKey,
  model,
  missing,
  requestBusy,
  explanation,
  explanationError,
  updateDraft,
  changeTaskType,
  explain,
  clearDraft,
  startNextExplanation,
}: ExplainPageProps) {
  return (
    <section className="explain-page">
      <form onSubmit={ explain } className="workspace-card form-card">
        <div className="task-switch" role="tablist" aria-label="Тип задания">
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftSentence(draft) }
            className={ isDraftSentence(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("sentence") }
          >Предложение
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftWords(draft) }
            className={ isDraftWords(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("words") }
          >Слова
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftPasteBlank(draft) }
            className={ isDraftPasteBlank(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("paste-blank") }
          >Пропуски
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftTest(draft) }
            className={ isDraftTest(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("test") }
          >Тест
          </button>
        </div>
        { isDraftWords(draft) && (
          <Field
            label="Описание задания"
            hint="Необязательно: уточните, что нужно сделать, — например, составить вопрос, отрицание или употребить указанное время."
          >
            <input
              className="text-input"
              value={ draft.wordsDescription }
              onChange={ (event) => updateDraft("wordsDescription", event.target.value) }
              placeholder="например, составьте вопрос к предложению"
            />
          </Field>
        ) }
        { isDraftWords(draft) && (
          <Field
            label="Слова для задания"
            hint="Введите слова или фразы, из которых нужно составить предложение."
          >
            <div className="word-list">
              { draft.words.map((word, index) => (
                <div className="word-input" key={ index }>
                  <span className="word-index">{ String(index + 1).padStart(2, "0") }</span>
                  <input
                    aria-label={ `Слово ${ index + 1 }` }
                    value={ word }
                    onChange={ (event) =>
                      updateDraft(
                        "words",
                        draft.words.map((item, i) => (i === index ? event.target.value : item)),
                      ) }
                    placeholder={
                      index === 0
                        ? "например, she"
                        : index === 1
                          ? "например, go to work"
                          : "Добавьте слово или фразу"
                    }
                  />
                  <button
                    className="icon-button remove-word"
                    type="button"
                    disabled={ draft.words.length <= 1 }
                    onClick={ () => updateDraft("words", draft.words.filter((_, i) => i !== index)) }
                    aria-label={ `Удалить слово ${ index + 1 }` }
                  >×
                  </button>
                </div>
              )) }
              <button
                className="add-word"
                type="button"
                onClick={ () => updateDraft("words", [...draft.words, ""]) }
              ><span>＋</span> Добавить слово
              </button>
            </div>
          </Field>
        ) }
        { isDraftSentence(draft) && (
          <Field
            label="Исходное предложение"
            hint="Предложение, которое нужно перевести или преобразовать."
          >
            <textarea
              className="text-area source-area"
              rows={ 3 }
              value={ draft.sentence }
              onChange={ (event) => updateDraft("sentence", event.target.value) }
              placeholder="Введите исходное предложение…"
            />
          </Field>
        ) }
        { isDraftPasteBlank(draft) && (
          <Field
            label="Предложение с пропусками"
            hint="Чередуйте текст и пропуски. В пропусках можно указать варианты для вставки — или оставить пустым и записать свой и правильный ответ ниже."
          >
            <div className="blank-builder">
              { draft.blankTask.map((segment, index) => (
                segment.type === "text" ? (
                  <div className="word-input" key={ index }>
                    <span className="word-index" aria-hidden="true">Т</span>
                    <input
                      aria-label={ `Текст ${ index + 1 }` }
                      value={ segment.text }
                      onChange={ (event) =>
                        updateDraft(
                          "blankTask",
                          draft.blankTask.map((item, i) =>
                            (i === index ? { type: "text", text: event.target.value } : item)),
                        ) }
                      placeholder="текст предложения…"
                    />
                    <button
                      className="icon-button remove-word"
                      type="button"
                      disabled={ draft.blankTask.length <= 1 }
                      onClick={ () => updateDraft("blankTask", draft.blankTask.filter((_, i) => i !== index)) }
                      aria-label={ `Удалить текст ${ index + 1 }` }
                    >×
                    </button>
                  </div>
                ) : (
                  <div className="blank-segment" key={ index }>
                    <div className="blank-segment-head">
                      <span className="blank-tag" aria-hidden="true">ПРОПУСК</span>
                      <button
                        className="icon-button remove-word"
                        type="button"
                        disabled={ draft.blankTask.length <= 1 }
                        onClick={ () => updateDraft("blankTask", draft.blankTask.filter((_, i) => i !== index)) }
                        aria-label={ `Удалить пропуск ${ index + 1 }` }
                      >×
                      </button>
                    </div>
                    <div className="variant-list">
                      { segment.variants.map((variant, vi) => (
                        <div className="word-input variant-input" key={ vi }>
                          <span className="word-index" aria-hidden="true">{ String(vi + 1).padStart(2, "0") }</span>
                          <input
                            aria-label={ `Вариант ${ vi + 1 } для пропуска ${ index + 1 }` }
                            value={ variant }
                            onChange={ (event) =>
                              updateDraft(
                                "blankTask",
                                draft.blankTask.map((item, i) =>
                                  (i === index && item.type === "blank")
                                    ? { type: "blank", variants: item.variants.map((v, j) => (j === vi ? event.target.value : v)) }
                                    : item),
                              ) }
                            placeholder="вариант (необязательно)"
                          />
                          <button
                            className="icon-button remove-word"
                            type="button"
                            onClick={ () => updateDraft("blankTask", draft.blankTask.map((item, i) => (i === index && item.type === "blank") ? { type: "blank", variants: item.variants.filter((_, j) => j !== vi) } : item)) }
                            aria-label={ `Удалить вариант ${ vi + 1 }` }
                          >×
                          </button>
                        </div>
                      )) }
                      <button
                        className="add-word"
                        type="button"
                        onClick={ () => updateDraft("blankTask", draft.blankTask.map((item, i) => (i === index && item.type === "blank") ? { type: "blank", variants: [...item.variants, ""] } : item)) }
                      ><span>＋</span> Добавить вариант
                      </button>
                    </div>
                  </div>
                )
              )) }
              <div className="blank-add-row">
                <button
                  className="add-word"
                  type="button"
                  onClick={ () => updateDraft("blankTask", [...draft.blankTask, { type: "text", text: "" }]) }
                ><span>＋</span> Текст
                </button>
                <button
                  className="add-word"
                  type="button"
                  onClick={ () => updateDraft("blankTask", [...draft.blankTask, { type: "blank", variants: [] }]) }
                ><span>＋</span> Пропуск
                </button>
              </div>
            </div>
          </Field>
        ) }
        { isDraftTest(draft) && (
          <Field
            label="Вопрос теста"
            hint="Сформулируйте задание теста, к которому даны варианты ответа."
          >
            <textarea
              className="text-area source-area"
              rows={ 3 }
              value={ draft.testText }
              onChange={ (event) => updateDraft("testText", event.target.value) }
              placeholder="Введите вопрос теста…"
            />
          </Field>
        ) }
        { isDraftTest(draft) && (
          <Field
            label="Варианты ответа"
            hint="Добавьте варианты, из которых нужно выбрать правильный ответ."
          >
            <div className="word-list">
              { draft.testVariants.map((variant, index) => (
                <div className="word-input" key={ index }>
                  <span className="word-index">{ String(index + 1).padStart(2, "0") }</span>
                  <input
                    aria-label={ `Вариант ${ index + 1 }` }
                    value={ variant }
                    onChange={ (event) =>
                      updateDraft(
                        "testVariants",
                        draft.testVariants.map((item, i) => (i === index ? event.target.value : item)),
                      ) }
                    placeholder={ index === 0 ? "например, went" : "Добавьте вариант" }
                  />
                  <button
                    className="icon-button remove-word"
                    type="button"
                    disabled={ draft.testVariants.length <= 1 }
                    onClick={ () => updateDraft("testVariants", draft.testVariants.filter((_, i) => i !== index)) }
                    aria-label={ `Удалить вариант ${ index + 1 }` }
                  >×
                  </button>
                </div>
              )) }
              <button
                className="add-word"
                type="button"
                onClick={ () => updateDraft("testVariants", [...draft.testVariants, ""]) }
              ><span>＋</span> Добавить вариант
              </button>
            </div>
          </Field>
        ) }
        <div className="answer-grid">
          <Field label="Ваш вариант">
            <textarea
              className="text-area learner-area"
              rows={ 4 }
              value={ draft.userAnswer }
              onChange={ (event) => updateDraft("userAnswer", event.target.value) }
              placeholder="Напишите свой ответ…"
            />
          </Field>
          <Field label="Правильный вариант">
            <textarea
              className="text-area correct-area"
              rows={ 4 }
              value={ draft.correctAnswer }
              onChange={ (event) => updateDraft("correctAnswer", event.target.value) }
              placeholder="Введите правильный ответ…"
            />
          </Field>
        </div>
        { missing.length > 0 &&
          <div className="missing-note">
            <span className="missing-mark" aria-hidden="true">i</span>
            <span>Чтобы начать, добавьте { missing.join(", ") }. { (!apiKey || !model) && <>Настроить
              подключение можно в <Link href="/settings">настройках</Link>.</> }</span>
          </div> }
        { !online &&
          <div className="inline-alert" role="status">Сейчас нет интернета. Черновик сохранён, отправить запрос
            можно после подключения.</div> }
        <div className="submit-row">
          <button
            className="button button-primary"
            type="submit"
            disabled={ Boolean(missing.length) || requestBusy || !online }
          >
            <span>{ requestBusy ? "Разбираем ошибку…" : "Разобрать ошибку" }</span>
            <span className="button-arrow" aria-hidden="true">↗</span>
          </button>
          <button
            className="button button-outline"
            type="button"
            onClick={ clearDraft }
          >Очистить поля
          </button>
          <span className="submit-caption">Ваши ответы сохраняются в истории на этом устройстве.</span>
        </div>
      </form>
      { explanationError && <div className="inline-alert" role="alert">{ explanationError }</div> }
      { requestBusy && (
        <div className="loading-card" role="status">
          <span className="loader" />
          <span>
            <b>Ищем причину ошибки</b>
            <small>Сравниваем ваш ответ с правильным вариантом…</small>
          </span>
        </div>
      ) }
      { explanation && (
        <>
          <article className="workspace-card result-card">
            <div className="result-top">
              <div>
                <p className="eyebrow">РАЗБОР ОШИБКИ</p>
                <h2>Почему ответ отличается</h2>
              </div>
              <span className="result-date">{ dateLabel(explanation.createdAt) }</span>
            </div>
            <div className="result-rule" />
            <div className="result-answers">
              <div><span>ВАШ ВАРИАНТ</span><p>{ explanation.userAnswer }</p></div>
              <div><span>ПРАВИЛЬНО</span><p>{ explanation.correctAnswer }</p></div>
            </div>
            <Markdown source={ explanation.response } />
            <div className="result-meta">
              <span>{ explanation.model }</span><span>·</span>
              <span>Ответ на языке: { languageLabel(explanation.language) }</span>
            </div>
          </article>
          <div className="result-actions">
            <button
              className="button button-outline"
              type="button"
              onClick={ startNextExplanation }
            >Следующий разбор
            </button>
          </div>
        </>
      ) }
      { !explanation && !requestBusy &&
        <div className="quiet-note">
          <span className="note-glyph">✳</span>
          <p>Хороший разбор помогает заметить правило, а не просто запомнить правильный ответ.</p>
        </div> }
    </section>
  );
}

