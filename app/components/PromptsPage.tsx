"use client";

import type { Dispatch, SetStateAction } from "react";
import type { PromptTemplate } from "../lib";
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
  return (
    <section className="prompt-list">
      <div className="section-intro">
        <div>
          <span className="section-kicker">ПРАВИЛА РАЗБОРА</span>
          <h2>На что обратить внимание</h2>
        </div>
        <p>Включённые правила добавляются к системной инструкции каждого нового запроса.</p>
      </div>
      { prompts.map((prompt) => (
        <article
          className={ `prompt-card workspace-card ${ prompt.enabled ? "" : "disabled-prompt" }` }
          key={ prompt.id }
        >
          { editingPrompt === prompt.id ? (
            <form
              onSubmit={ (event) => {
                event.preventDefault();
                if (!editingValue.title.trim() || !editingValue.body.trim()) {
                  showToast("Заполните название и текст правила.", "error");
                  return;
                }
                setPrompts((current) =>
                  current.map((item) =>
                    item.id === prompt.id
                      ? { ...item, title: editingValue.title.trim(), body: editingValue.body.trim() }
                      : item),
                );
                setEditingPrompt(null);
                showToast("Правило обновлено.", "success");
              } }
            >
              <Field label="Название">
                <input
                  className="text-input"
                  value={ editingValue.title }
                  onChange={ (event) =>
                    setEditingValue((current) => ({ ...current, title: event.target.value })) }
                />
              </Field>
              <Field label="Инструкция">
                <textarea
                  className="text-area"
                  rows={ 3 }
                  value={ editingValue.body }
                  onChange={ (event) =>
                    setEditingValue((current) => ({ ...current, body: event.target.value })) }
                />
              </Field>
              <div className="inline-actions">
                <button className="button button-primary button-small">Сохранить</button>
                <button
                  className="button button-outline button-small"
                  type="button"
                  onClick={ () => setEditingPrompt(null) }
                >Отмена
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="prompt-number">{ String(prompts.indexOf(prompt) + 1).padStart(2, "0") }</div>
              <div className="prompt-copy">
                <div className="prompt-title-line">
                  <h3>{ prompt.title }</h3>
                  { prompt.builtin && <span className="builtin-tag">ВСТРОЕННЫЙ</span> }
                </div>
                <p>{ prompt.body }</p>
              </div>
              <div className="prompt-actions">
                <button
                  className="icon-button edit-button"
                  aria-label={ `Редактировать правило «${ prompt.title }»` }
                  onClick={ () => {
                    setEditingValue({ title: prompt.title, body: prompt.body });
                    setEditingPrompt(prompt.id);
                  } }
                >↗
                </button>
                <label
                  className="switch"
                  aria-label={ `${ prompt.enabled ? "Отключить" : "Включить" } правило «${ prompt.title }»` }
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
                    aria-label={ `Удалить правило «${ prompt.title }»` }
                    onClick={ () => {
                      if (window.confirm(`Удалить правило «${ prompt.title }»?`)) {
                        setPrompts((current) => current.filter((item) => item.id !== prompt.id));
                        showToast("Правило удалено.", "success");
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
            showToast("Укажите название и инструкцию для правила.", "error");
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
          showToast("Новое правило добавлено.", "success");
        } }
      >
        <div className="add-prompt-heading">
          <span className="add-icon">＋</span>
          <div>
            <h2>Добавить своё правило</h2>
            <p>Создайте дополнительный фокус для разбора.</p>
          </div>
        </div>
        <Field label="Название">
          <input
            className="text-input"
            value={ promptForm.title }
            onChange={ (event) =>
              setPromptForm((current) => ({ ...current, title: event.target.value })) }
            placeholder="Например, Произношение"
          />
        </Field>
        <Field label="Инструкция">
          <textarea
            className="text-area"
            rows={ 3 }
            value={ promptForm.body }
            onChange={ (event) =>
              setPromptForm((current) => ({ ...current, body: event.target.value })) }
            placeholder="Что модель должна проверить?"
          />
        </Field>
        <button className="button button-primary button-small">Добавить правило <span className="button-arrow">↗</span></button>
      </form>
    </section>
  );
}

