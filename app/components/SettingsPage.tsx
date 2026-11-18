"use client";

import Link from "next/link";
import { useRef, type Dispatch, type SetStateAction } from "react";
import { LANGUAGES, type Settings } from "../lib";
import { useI18n } from "../i18n";
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
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <section className="settings-grid">
      <div className="settings-main">
        <section className="workspace-card settings-card">
          <div className="card-heading">
            <span className="card-index">01</span>
            <div>
              <h2>{ t.settings.connectionTitle }</h2>
              <p>{ t.settings.connectionLede }</p>
            </div>
          </div>
          <Field label={ t.settings.baseUrlLabel }>
            <input
              className="text-input mono-input"
              type="url"
              value={ settings.baseUrl }
              onChange={ (event) => updateSetting("baseUrl", event.target.value) }
              placeholder="https://api.openai.com/v1"
            />
          </Field>
          <Field
            label={ t.settings.apiKeyLabel }
            controlId="api-key-field"
            hint={ t.settings.apiKeyHint }
          >
            <div className="key-field">
              <input
                id="api-key-field"
                aria-label={ t.settings.apiKeyLabel }
                className="text-input mono-input"
                type={ keyVisible ? "text" : "password" }
                autoComplete="off"
                value={ keyDraft }
                onChange={ (event) => setKeyDraft(event.target.value) }
                placeholder={ apiKey ? t.settings.apiKeyPlaceholderSaved : t.settings.apiKeyPlaceholder }
              />
              <button
                type="button"
                className="key-toggle"
                onClick={ () => setKeyVisible((value) => !value) }
              >{ keyVisible ? t.settings.hideKey : t.settings.showKey }</button>
            </div>
            <div className="key-status">
              <span className={ `saved-dot ${ apiKey ? "" : "empty" }` } />
              { apiKey ? t.settings.keySavedStatus : t.settings.keyNotSavedStatus }
            </div>
            <div className="inline-actions key-actions">
              <button className="button button-outline button-small" type="button" onClick={ saveKey }>{ t.settings.saveKeyBtn }
              </button>
              { apiKey &&
                <button className="text-danger" type="button" onClick={ clearKey }>{ t.settings.deleteKeyBtn }</button> }
            </div>
          </Field>
          <Field label={ t.settings.modelLabel }>
            <select
              className="text-input"
              value={ settings.model }
              onChange={ (event) => updateSetting("model", event.target.value) }
            >
              <option value="">{ t.settings.selectModel }</option>
              { settings.model && !models.includes(settings.model) &&
                <option value={ settings.model }>{ t.settings.currentModel(settings.model) }</option> }
              { models.map((model) => <option key={ model } value={ model }>{ model }</option>) }
            </select>
          </Field>
          <div className="model-actions">
            <button
              className="button button-outline button-small"
              type="button"
              onClick={ () => requestModels("models") }
              disabled={ Boolean(settingsBusy) }
            >{ settingsBusy === "models" ? <><span className="mini-loader" />{ t.settings.loadingModelsBtn }</> : t.settings.loadModels }</button>
            <button
              className="button button-soft button-small"
              type="button"
              onClick={ () => requestModels("check") }
              disabled={ Boolean(settingsBusy) }
            >{ settingsBusy === "check" ? <><span className="mini-loader" />{ t.common.checking }</> : t.settings.checkConnection }</button>
          </div>
          { providerStatus && (
            <div
              className={ `provider-feedback ${ providerStatusTone === "error" ? "feedback-error" : providerStatusTone === "info" ? "feedback-info" : "" }` }
              role="status"
            >{ providerStatus }</div>
          ) }
          <p className="provider-hint">{ t.settings.providersHint }</p>
        </section>
        <section className="workspace-card settings-card">
          <div className="card-heading">
            <span className="card-index">02</span>
            <div>
              <h2>{ t.settings.interfaceTitle }</h2>
              <p>{ t.settings.interfaceLede }</p>
            </div>
          </div>
          <Field label={ t.settings.interfaceLabel }>
            <select
              className="text-input language-select"
              value={ settings.uiLanguage }
              onChange={ (event) => updateSetting("uiLanguage", event.target.value) }
            >
              { LANGUAGES.map(([code, label]) => <option key={ code } value={ code }>{ label }</option>) }
            </select>
          </Field>
        </section>
        <section className="workspace-card settings-card">
          <div className="card-heading">
            <span className="card-index">03</span>
            <div>
              <h2>{ t.settings.responseTitle }</h2>
              <p>{ t.settings.responseLede }</p>
            </div>
          </div>
          <Field label={ t.settings.responseLabel }>
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
              label={ t.settings.suffixLabel }
              hint={ t.settings.suffixHint }
            >
              <textarea
                className="text-area"
                rows={ 4 }
                value={ settings.suffix }
                onChange={ (event) => updateSetting("suffix", event.target.value) }
                placeholder={ t.settings.suffixPlaceholder }
              />
            </Field>
          </div>
        </section>
        <section className="workspace-card settings-card">
          <div className="card-heading">
            <span className="card-index">04</span>
            <div>
              <h2>{ t.settings.exportTitle }</h2>
              <p>{ t.settings.exportLede }</p>
            </div>
          </div>
          <p className="export-hint">{ t.settings.exportHint }</p>
          <div className="inline-actions">
            <button
              type="button"
              className="button button-outline button-small"
              onClick={ exportSettings }
            >{ t.settings.exportBtn }</button>
            <button
              type="button"
              className="button button-outline button-small"
              onClick={ () => fileInputRef.current?.click() }
            >{ t.settings.importBtn }</button>
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
          <span className="section-kicker">{ t.settings.aboutKicker }</span>
          <h2>{ t.settings.aboutTitle }</h2>
          <p>{ t.settings.aboutText }</p>
        </div>
        <div className="privacy-card">
          <span className="privacy-lock" aria-hidden="true">⌑</span>
          <h3>{ t.settings.privacyTitle }</h3>
          <p>{ t.settings.privacyText }</p>
          <Link href="/instruction">{ t.settings.privacyLink } <span>↗</span></Link>
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
            <b>{ t.install.cardTitle }</b>
            <small>{ t.install.cardHint }</small>
          </button>
        ) : (
          <div className="install-note">
            <span className="install-note-mark">↗</span>
            <h3>{ t.settings.installTitle }</h3>
            <p>{ installInstructions }</p>
          </div>
        ) }
      </aside>
    </section>
  );
}
