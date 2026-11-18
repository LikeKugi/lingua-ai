"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PromptTemplate } from "../lib";
import { useI18n } from "../i18n";
import { Field } from "./ui";
import type { Toast } from "./types";

interface PromptForm {
  title: string;
  body: string;
}

interface PromptsPageProps {
  prompts: PromptTemplate[];
  editingPrompt: string | null;
  editingValue: PromptForm;
  promptForm: PromptForm;
  setPrompts: Dispatch<SetStateAction<PromptTemplate[]>>;
  setEditingPrompt: Dispatch<SetStateAction<string | null>>;
  setEditingValue: Dispatch<SetStateAction<PromptForm>>;
  setPromptForm: Dispatch<SetStateAction<PromptForm>>;
  showToast: (text: string, kind?: Toast["kind"]) => void;
}

export default function PromptsPage({
  prompts,
  editingPrompt,
  editingValue,
  promptForm,
  setPrompts,
  setEditingPrompt,
  setEditingValue,
  setPromptForm,
  showToast,
}: PromptsPageProps) {
  const { t } = useI18n();
  return (
    <section className="prompt-list">
      <div className="section-intro">
        <div>
          <span className="section-kicker">{ t.prompts.kicker }</span>
          <h2>{ t.prompts.title }</h2>
        </div>
        <p>{ t.prompts.lede }</p>
      </div>
      { prompts.map((prompt) => (
        <article
          className={ `prompt-card workspace-card ${ prompt.enabled ? "" : "disabled-prompt" }` }
          key={ prompt.id }
        >
          { editingPrompt === prompt.id ? (
            <>
              <span className="edit-prompt-icon" aria-hidden="true">✎</span>
              <form
                className="edit-prompt-form"
                onSubmit={ (event) => {
                event.preventDefault();
                if (!editingValue.title.trim() || !editingValue.body.trim()) {
                  showToast(t.prompts.editInvalid, "error");
                  return;
                }
                setPrompts((current) =>
                  current.map((item) =>
                    item.id === prompt.id
                      ? { ...item, title: editingValue.title.trim(), body: editingValue.body.trim() }
                      : item),
                );
                setEditingPrompt(null);
                showToast(t.prompts.updated, "success");
              } }
            >
              <Field label={ t.prompts.nameLabel }>
                <input
                  className="text-input"
                  value={ editingValue.title }
                  onChange={ (event) =>
                    setEditingValue((current) => ({ ...current, title: event.target.value })) }
                />
              </Field>
              <Field label={ t.prompts.bodyLabel }>
                <textarea
                  className="text-area"
                  rows={ 3 }
                  value={ editingValue.body }
                  onChange={ (event) =>
                    setEditingValue((current) => ({ ...current, body: event.target.value })) }
                />
              </Field>
              <div className="inline-actions">
                <button className="button button-primary button-small">{ t.common.save }</button>
                <button
                  className="button button-outline button-small"
                  type="button"
                  onClick={ () => setEditingPrompt(null) }
                >{ t.common.cancel }
                </button>
              </div>
              </form>
            </>
          ) : (
            <>
              <div className="prompt-number">{ String(prompts.indexOf(prompt) + 1).padStart(2, "0") }</div>
              <div className="prompt-copy">
                <div className="prompt-title-line">
                  <h3>{ prompt.title }</h3>
                  { prompt.builtin && <span className="builtin-tag">{ t.prompts.builtin }</span> }
                </div>
                <p>{ prompt.body }</p>
              </div>
              <div className="prompt-actions">
                <button
                  className="icon-button edit-button"
                  aria-label={ t.prompts.editAria(prompt.title) }
                  onClick={ () => {
                    setEditingValue({ title: prompt.title, body: prompt.body });
                    setEditingPrompt(prompt.id);
                  } }
                >↗
                </button>
                <label
                  className="switch"
                  aria-label={ prompt.enabled ? t.prompts.disableAria(prompt.title) : t.prompts.enableAria(prompt.title) }
                >
                  <input
                    type="checkbox"
                    checked={ prompt.enabled }
                    onChange={ () =>
                      setPrompts((current) =>
                        current.map((item) =>
                          item.id === prompt.id ? { ...item, enabled: !item.enabled } : item),
                      ) }
                  />
                  <span />
                </label>
                { !prompt.builtin && (
                  <button
                    className="icon-button delete-prompt"
                    aria-label={ t.prompts.deleteAria(prompt.title) }
                    onClick={ () => {
                      if (window.confirm(t.prompts.confirmDelete(prompt.title))) {
                        setPrompts((current) => current.filter((item) => item.id !== prompt.id));
                        showToast(t.prompts.deleted, "success");
                      }
                    } }
                  >×
                  </button>
                ) }
              </div>
            </>
          ) }
        </article>
      )) }
      <form
        className="add-prompt-card"
        onSubmit={ (event) => {
          event.preventDefault();
          if (!promptForm.title.trim() || !promptForm.body.trim()) {
            showToast(t.prompts.addInvalid, "error");
            return;
          }
          setPrompts((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              title: promptForm.title.trim(),
              body: promptForm.body.trim(),
              enabled: true,
              builtin: false,
            },
          ]);
          setPromptForm({ title: "", body: "" });
          showToast(t.prompts.added, "success");
        } }
      >
        <div className="add-prompt-heading">
          <span className="add-icon">＋</span>
          <div>
            <h2>{ t.prompts.addTitle }</h2>
            <p>{ t.prompts.addLede }</p>
          </div>
        </div>
        <Field label={ t.prompts.nameLabel }>
          <input
            className="text-input"
            value={ promptForm.title }
            onChange={ (event) =>
              setPromptForm((current) => ({ ...current, title: event.target.value })) }
            placeholder={ t.prompts.namePlaceholder }
          />
        </Field>
        <Field label={ t.prompts.bodyLabel }>
          <textarea
            className="text-area"
            rows={ 3 }
            value={ promptForm.body }
            onChange={ (event) =>
              setPromptForm((current) => ({ ...current, body: event.target.value })) }
            placeholder={ t.prompts.bodyPlaceholder }
          />
        </Field>
        <button className="button button-primary button-small">{ t.prompts.addBtn } <span className="button-arrow">↗</span></button>
      </form>
    </section>
  );
}

