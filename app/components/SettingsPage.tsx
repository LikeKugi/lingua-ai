"use client";

import Link from "next/link";
import { useRef, type Dispatch, type SetStateAction } from "react";
import { LANGUAGES, type Settings } from "../lib";
import { Field } from "./ui";

interface SettingsPageProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  apiKey: string;
  keyDraft: string;
  keyVisible: boolean;
  models: string[];
  settingsBusy: "models" | "check" | null;
  providerStatus: string;
  providerStatusTone: "success" | "error" | "info";
  installPrompt: Event | null;
  installInstructions: string;
  saveKey: () => void;
  clearKey: () => void;
  exportSettings: () => void;
  importSettings: (file: File) => void;
  setKeyDraft: Dispatch<SetStateAction<string>>;
  setKeyVisible: Dispatch<SetStateAction<boolean>>;
  setInstallPrompt: Dispatch<SetStateAction<Event | null>>;
  requestModels: (mode: "models" | "check") => void;
}

export default function SettingsPage({
  settings,
  updateSetting,
  apiKey,
  keyDraft,
  keyVisible,
  models,
  settingsBusy,
  providerStatus,
  providerStatusTone,
  installPrompt,
  installInstructions,
  saveKey,
  clearKey,
  exportSettings,
  importSettings,
  setKeyDraft,
  setKeyVisible,
  setInstallPrompt,
  requestModels,
}: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <section className="settings-grid">
      <div className="settings-main">
        <section className="workspace-card settings-card">
          <div className="card-heading">
            <span className="card-index">01</span>
            <div>
              <h2>Подключение к модели</h2>
              <p>Используйте ключ своего OpenAI-совместимого сервиса.</p>
            </div>
          </div>
          <Field label="Базовый URL">
            <input
              className="text-input mono-input"
              type="url"
              value={ settings.baseUrl }
              onChange={ (event) => updateSetting("baseUrl", event.target.value) }
              placeholder="https://api.openai.com/v1"
            />
          </Field>
          <Field
            label="Ключ API"
            controlId="api-key-field"
            hint="Браузер не предоставляет защищённого хранилища. Сохранённый ключ находится в localStorage этого браузера."
          >
            <div className="key-field">
              <input
                id="api-key-field"
                aria-label="Ключ API"
                className="text-input mono-input"
                type={ keyVisible ? "text" : "password" }
                autoComplete="off"
                value={ keyDraft }
                onChange={ (event) => setKeyDraft(event.target.value) }
                placeholder={ apiKey ? "Ключ сохранён — введите замену" : "Введите ключ API" }
              />
              <button
                type="button"
                className="key-toggle"
                onClick={ () => setKeyVisible((value) => !value) }
              >{ keyVisible ? "Скрыть" : "Показать" }</button>
            </div>
            <div className="key-status">
              <span className={ `saved-dot ${ apiKey ? "" : "empty" }` } />
              { apiKey ? "Ключ сохранён в этом браузере" : "Ключ ещё не сохранён" }
            </div>
            <div className="inline-actions key-actions">
              <button className="button button-outline button-small" type="button" onClick={ saveKey }>Сохранить ключ
              </button>
              { apiKey &&
                <button className="text-danger" type="button" onClick={ clearKey }>Удалить ключ</button> }
            </div>
          </Field>
          <Field label="Модель">
            <select
              className="text-input"
              value={ settings.model }
              onChange={ (event) => updateSetting("model", event.target.value) }
            >
              <option value="">Выберите модель</option>
              { settings.model && !models.includes(settings.model) &&
                <option value={ settings.model }>{ settings.model } · текущая</option> }
              { models.map((model) => <option key={ model } value={ model }>{ model }</option>) }
            </select>
          </Field>
          <div className="model-actions">
            <button
              className="button button-outline button-small"
              type="button"
              onClick={ () => requestModels("models") }
              disabled={ Boolean(settingsBusy) }
            >{ settingsBusy === "models" ? <><span className="mini-loader" />Загружаем…</> : "Загрузить модели" }</button>
            <button
              className="button button-soft button-small"
              type="button"
              onClick={ () => requestModels("check") }
              disabled={ Boolean(settingsBusy) }
            >{ settingsBusy === "check" ? <><span className="mini-loader" />Проверяем…</> : "Проверить подключение" }</button>
          </div>
          { providerStatus && (
            <div
              className={ `provider-feedback ${ providerStatusTone === "error" ? "feedback-error" : providerStatusTone === "info" ? "feedback-info" : "" }` }
              role="status"
            >{ providerStatus }</div>
          ) }
          <p className="provider-hint">Поддерживаются OpenAI, OpenRouter, Groq, Together, DeepSeek, Mistral, Ollama и LM Studio.</p>
        </section>
        <section className="workspace-card settings-card">
          <div className="card-heading">
            <span className="card-index">02</span>
            <div>
              <h2>Язык ответа</h2>
              <p>Язык объяснения выбирается отдельно от языка задания.</p>
            </div>
          </div>
          <Field label="Отвечать на языке">
            <select
              className="text-input language-select"
              value={ settings.language }
              onChange={ (event) => updateSetting("language", event.target.value) }
            >
              { LANGUAGES.map(([code, label]) => <option key={ code } value={ code }>{ label }</option>) }
            </select>
          </Field>
          <div className="field suffix-field">
            <Field
              label="Дополнительная инструкция"
              hint="Добавляется после активных правил и перед указанием языка ответа."
            >
              <textarea
                className="text-area"
                rows={ 4 }
                value={ settings.suffix }
                onChange={ (event) => updateSetting("suffix", event.target.value) }
                placeholder="Например: используй короткие примеры из повседневной речи…"
              />
            </Field>
          </div>
        </section>
        <section className="workspace-card settings-card">
          <div className="card-heading">
            <span className="card-index">03</span>
            <div>
              <h2>Экспорт и импорт</h2>
              <p>Сохраните настройки в файл или восстановите их на другом устройстве.</p>
            </div>
          </div>
          <p className="export-hint">Ключ API и адрес сервиса записываются в файл в замаскированном виде — в открытом тексте они не хранятся.</p>
          <div className="inline-actions">
            <button
              type="button"
              className="button button-outline button-small"
              onClick={ exportSettings }
            >Экспорт настроек</button>
            <button
              type="button"
              className="button button-outline button-small"
              onClick={ () => fileInputRef.current?.click() }
            >Импорт настроек</button>
            <input
              ref={ fileInputRef }
              type="file"
              accept="application/json,.json"
              hidden
              onChange={ (event) => {
                const file = event.target.files?.[0];
                if (file) importSettings(file);
                event.target.value = "";
              } }
            />
          </div>
        </section>
      </div>
      <aside className="settings-aside">
        <div className="provider-note">
          <span className="provider-note-icon">✳</span>
          <span className="section-kicker">ВАШ ВЫБОР</span>
          <h2>Вы выбираете модель и оплачиваете её напрямую.</h2>
          <p>Лингва бесплатна и не добавляет подписок или платы за запросы. Стоимость использования определяет ваш провайдер.</p>
        </div>
        <div className="privacy-card">
          <span className="privacy-lock" aria-hidden="true">⌑</span>
          <h3>Данные остаются у вас</h3>
          <p>История, инструкции и настройки хранятся в браузере. Ключ отправляется только на сервер Лингвы при проверке или запросе, а оттуда — выбранному сервису.</p>
          <Link href="/instruction">Как формируется запрос <span>↗</span></Link>
        </div>
        { installPrompt ? (
          <button
            className="install-card"
            onClick={ async () => {
              const prompt = installPrompt as Event & { prompt?: () => Promise<void> };
              await prompt.prompt?.();
              setInstallPrompt(null);
            } }
          >
            <span>＋</span>
            <b>Установить Лингву</b>
            <small>Добавить приложение на устройство</small>
          </button>
        ) : (
          <div className="install-note">
            <span className="install-note-mark">↗</span>
            <h3>Установка приложения</h3>
            <p>{ installInstructions }</p>
          </div>
        ) }
      </aside>
    </section>
  );
}

