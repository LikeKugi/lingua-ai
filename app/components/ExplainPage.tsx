"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { dateLabel, languageLabel, type HistoryItem, type TaskType } from "../lib";
import { Field, Markdown } from "./ui";
import { useI18n, withLink } from "../i18n";
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
  const { t, locale } = useI18n();
  return (
    <section className="explain-page">
      <form onSubmit={ explain } className="workspace-card form-card">
        <div className="task-switch" role="tablist" aria-label={ t.explain.taskTypesAria }>
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftSentence(draft) }
            className={ isDraftSentence(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("sentence") }
          >{ t.labels.taskTypes.sentence }
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftWords(draft) }
            className={ isDraftWords(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("words") }
          >{ t.labels.taskTypes.words }
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftPasteBlank(draft) }
            className={ isDraftPasteBlank(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("paste-blank") }
          >{ t.labels.taskTypes.pasteBlank }
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ isDraftTest(draft) }
            className={ isDraftTest(draft) ? "selected" : "" }
            onClick={ () => changeTaskType("test") }
          >{ t.labels.taskTypes.test }
          </button>
        </div>
        { isDraftWords(draft) && (
          <Field
            label={ t.explain.descriptionLabel }
            hint={ t.explain.descriptionHint }
          >
            <input
              className="text-input"
              value={ draft.wordsDescription }
              onChange={ (event) => updateDraft("wordsDescription", event.target.value) }
              placeholder={ t.explain.descriptionPlaceholder }
            />
          </Field>
        ) }
        { isDraftWords(draft) && (
          <Field
            label={ t.explain.wordsLabel }
            hint={ t.explain.wordsHint }
          >
            <div className="word-list">
              { draft.words.map((word, index) => (
                <div className="word-input" key={ index }>
                  <span className="word-index">{ String(index + 1).padStart(2, "0") }</span>
                  <input
                    aria-label={ t.explain.wordAria(index + 1) }
                    value={ word }
                    onChange={ (event) =>
                      updateDraft(
                        "words",
                        draft.words.map((item, i) => (i === index ? event.target.value : item)),
                      ) }
                    placeholder={
                      index === 0
                        ? t.explain.wordPlaceholderFirst
                        : index === 1
                          ? t.explain.wordPlaceholderSecond
                          : t.explain.wordPlaceholderNext
                    }
                  />
                  <button
                    className="icon-button remove-word"
                    type="button"
                    disabled={ draft.words.length <= 1 }
                    onClick={ () => updateDraft("words", draft.words.filter((_, i) => i !== index)) }
                    aria-label={ t.explain.removeWordAria(index + 1) }
                  >×
                  </button>
                </div>
              )) }
              <button
                className="add-word"
                type="button"
                onClick={ () => updateDraft("words", [...draft.words, ""]) }
              ><span>＋</span> { t.explain.addWord }
              </button>
            </div>
          </Field>
        ) }
        { isDraftSentence(draft) && (
          <Field
            label={ t.explain.sentenceLabel }
            hint={ t.explain.sentenceHint }
          >
            <textarea
              className="text-area source-area"
              rows={ 3 }
              value={ draft.sentence }
              onChange={ (event) => updateDraft("sentence", event.target.value) }
              placeholder={ t.explain.sentencePlaceholder }
            />
          </Field>
        ) }
        { isDraftPasteBlank(draft) && (
          <Field
            label={ t.explain.blankLabel }
            hint={ t.explain.blankHint }
          >
            <div className="blank-builder">
              { draft.blankTask.map((segment, index) => (
                segment.type === "text" ? (
                  <div className="word-input" key={ index }>
                    <span className="word-index" aria-hidden="true">{ t.explain.blankTextMarker }</span>
                    <input
                      aria-label={ t.explain.textAria(index + 1) }
                      value={ segment.text }
                      onChange={ (event) =>
                        updateDraft(
                          "blankTask",
                          draft.blankTask.map((item, i) =>
                            (i === index ? { type: "text", text: event.target.value } : item)),
                        ) }
                      placeholder={ t.explain.textPlaceholder }
                    />
                    <button
                      className="icon-button remove-word"
                      type="button"
                      disabled={ draft.blankTask.length <= 1 }
                      onClick={ () => updateDraft("blankTask", draft.blankTask.filter((_, i) => i !== index)) }
                      aria-label={ t.explain.removeTextAria(index + 1) }
                    >×
                    </button>
                  </div>
                ) : (
                  <div className="blank-segment" key={ index }>
                    <div className="blank-segment-head">
                      <span className="blank-tag" aria-hidden="true">{ t.explain.blankTag }</span>
                      <button
                        className="icon-button remove-word"
                        type="button"
                        disabled={ draft.blankTask.length <= 1 }
                        onClick={ () => updateDraft("blankTask", draft.blankTask.filter((_, i) => i !== index)) }
                        aria-label={ t.explain.removeBlankAria(index + 1) }
                      >×
                      </button>
                    </div>
                    <div className="variant-list">
                      { segment.variants.map((variant, vi) => (
                        <div className="word-input variant-input" key={ vi }>
                          <span className="word-index" aria-hidden="true">{ String(vi + 1).padStart(2, "0") }</span>
                          <input
                            aria-label={ t.explain.variantAria(vi + 1, index + 1) }
                            value={ variant }
                            onChange={ (event) =>
                              updateDraft(
                                "blankTask",
                                draft.blankTask.map((item, i) =>
                                  (i === index && item.type === "blank")
                                    ? { type: "blank", variants: item.variants.map((v, j) => (j === vi ? event.target.value : v)) }
                                    : item),
                              ) }
                            placeholder={ t.explain.variantPlaceholder }
                          />
                          <button
                            className="icon-button remove-word"
                            type="button"
                            onClick={ () => updateDraft("blankTask", draft.blankTask.map((item, i) => (i === index && item.type === "blank") ? { type: "blank", variants: item.variants.filter((_, j) => j !== vi) } : item)) }
                            aria-label={ t.explain.removeVariantAria(vi + 1) }
                          >×
                          </button>
                        </div>
                      )) }
                      <button
                        className="add-word"
                        type="button"
                        onClick={ () => updateDraft("blankTask", draft.blankTask.map((item, i) => (i === index && item.type === "blank") ? { type: "blank", variants: [...item.variants, ""] } : item)) }
                      ><span>＋</span> { t.explain.addVariant }
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
                ><span>＋</span> { t.explain.addText }
                </button>
                <button
                  className="add-word"
                  type="button"
                  onClick={ () => updateDraft("blankTask", [...draft.blankTask, { type: "blank", variants: [] }]) }
                ><span>＋</span> { t.explain.addBlank }
                </button>
              </div>
            </div>
          </Field>
        ) }
        { isDraftTest(draft) && (
          <Field
            label={ t.explain.testLabel }
            hint={ t.explain.testHint }
          >
            <textarea
              className="text-area source-area"
              rows={ 3 }
              value={ draft.testText }
              onChange={ (event) => updateDraft("testText", event.target.value) }
              placeholder={ t.explain.testPlaceholder }
            />
          </Field>
        ) }
        { isDraftTest(draft) && (
          <Field
            label={ t.explain.testVariantsLabel }
            hint={ t.explain.testVariantsHint }
          >
            <div className="word-list">
              { draft.testVariants.map((variant, index) => (
                <div className="word-input" key={ index }>
                  <span className="word-index">{ String(index + 1).padStart(2, "0") }</span>
                  <input
                    aria-label={ t.explain.testVariantAria(index + 1) }
                    value={ variant }
                    onChange={ (event) =>
                      updateDraft(
                        "testVariants",
                        draft.testVariants.map((item, i) => (i === index ? event.target.value : item)),
                      ) }
                    placeholder={ index === 0 ? t.explain.testVariantFirst : t.explain.testVariantNext }
                  />
                  <button
                    className="icon-button remove-word"
                    type="button"
                    disabled={ draft.testVariants.length <= 1 }
                    onClick={ () => updateDraft("testVariants", draft.testVariants.filter((_, i) => i !== index)) }
                    aria-label={ t.explain.removeVariantAria(index + 1) }
                  >×
                  </button>
                </div>
              )) }
              <button
                className="add-word"
                type="button"
                onClick={ () => updateDraft("testVariants", [...draft.testVariants, ""]) }
              ><span>＋</span> { t.explain.addVariant }
              </button>
            </div>
          </Field>
        ) }
        <div className="answer-grid">
          <Field label={ t.explain.yourAnswer }>
            <textarea
              className="text-area learner-area"
              rows={ 4 }
              value={ draft.userAnswer }
              onChange={ (event) => updateDraft("userAnswer", event.target.value) }
              placeholder={ t.explain.yourAnswerPlaceholder }
            />
          </Field>
          <Field label={ t.explain.correctAnswer }>
            <textarea
              className="text-area correct-area"
              rows={ 4 }
              value={ draft.correctAnswer }
              onChange={ (event) => updateDraft("correctAnswer", event.target.value) }
              placeholder={ t.explain.correctAnswerPlaceholder }
            />
          </Field>
        </div>
        { missing.length > 0 &&
          <div className="missing-note">
            <span className="missing-mark" aria-hidden="true">i</span>
            <span>{ t.explain.missingNote(missing.join(t.common.listSeparator)) } { (!apiKey || !model) && withLink(t.explain.settingsHint, <Link href="/settings">{ t.explain.settingsLink }</Link>) }</span>
          </div> }
        { !online &&
          <div className="inline-alert" role="status">{ t.explain.offline }</div> }
        <div className="submit-row">
          <button
            className="button button-primary"
            type="submit"
            disabled={ Boolean(missing.length) || requestBusy || !online }
          >
            <span>{ requestBusy ? t.explain.submitBusy : t.explain.submit }</span>
            <span className="button-arrow" aria-hidden="true">↗</span>
          </button>
          <button
            className="button button-outline"
            type="button"
            onClick={ clearDraft }
          >{ t.explain.clearFields }
          </button>
          <span className="submit-caption">{ t.explain.submitCaption }</span>
        </div>
      </form>
      { explanationError && <div className="inline-alert" role="alert">{ explanationError }</div> }
      { requestBusy && (
        <div className="loading-card" role="status">
          <span className="loader" />
          <span>
            <b>{ t.explain.loadingTitle }</b>
            <small>{ t.explain.loadingText }</small>
          </span>
        </div>
      ) }
      { explanation && (
        <>
          <article className="workspace-card result-card">
            <div className="result-top">
              <div>
                <p className="eyebrow">{ t.explain.resultKicker }</p>
                <h2>{ t.explain.resultTitle }</h2>
              </div>
              <span className="result-date">{ dateLabel(explanation.createdAt, locale) }</span>
            </div>
            <div className="result-rule" />
            <div className="result-answers">
              <div><span>{ t.labels.yourAnswer }</span><p>{ explanation.userAnswer }</p></div>
              <div><span>{ t.labels.correct }</span><p>{ explanation.correctAnswer }</p></div>
            </div>
            <Markdown source={ explanation.response } />
            <div className="result-meta">
              <span>{ explanation.model }</span><span>·</span>
              <span>{ t.common.answerInLanguage(languageLabel(explanation.language)) }</span>
            </div>
          </article>
          <div className="result-actions">
            <button
              className="button button-outline"
              type="button"
              onClick={ startNextExplanation }
            >{ t.explain.nextExplanation }
            </button>
          </div>
        </>
      ) }
      { !explanation && !requestBusy &&
        <div className="quiet-note">
          <span className="note-glyph">✳</span>
          <p>{ t.explain.quietNote }</p>
        </div> }
    </section>
  );
}

