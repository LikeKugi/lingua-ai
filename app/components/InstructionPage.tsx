"use client";

import Link from "next/link";
import { DEFAULT_SYSTEM_PROMPT, type Settings } from "../lib";
import { Field } from "./ui";
import type { Toast } from "./types";

interface InstructionPageProps {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  showToast: (text: string, kind?: Toast["kind"]) => void;
}

export default function InstructionPage({
  settings,
  updateSetting,
  showToast,
}: InstructionPageProps) {
  return (
    <section className="instruction-page workspace-card">
      <div className="instruction-overline">
        <span className="instruction-icon">≡</span>
        <div>
          <span className="section-kicker">ОСНОВА КАЖДОГО РАЗБОРА</span>
          <p>Эту инструкцию вы задаёте модели вместе с заданием, ответами и включёнными правилами.</p>
        </div>
      </div>
      <Field
        label="Системная инструкция"
        hint={ `${ settings.systemPrompt.length.toLocaleString("ru-RU") } символов · сохраняется автоматически` }
      >
        <textarea
          className="text-area system-prompt"
          rows={ 13 }
          value={ settings.systemPrompt }
          onChange={ (event) => updateSetting("systemPrompt", event.target.value) }
        />
      </Field>
      <div className="instruction-footer">
        <span className="saved-inline"><span className="saved-dot" />Изменения сохраняются автоматически</span>
        <button
          className="button button-outline"
          onClick={ () => {
            if (window.confirm("Вернуть стандартную инструкцию? Ваши промпты и суффикс останутся без изменений.")) {
              updateSetting("systemPrompt", DEFAULT_SYSTEM_PROMPT);
              showToast("Стандартная инструкция восстановлена.", "success");
            }
          } }
        >Сбросить к стандартной
        </button>
      </div>
      <div className="privacy-note">
        <span aria-hidden="true">✳</span>
        <p>В запрос также входят активные правила из раздела <Link href="/prompts">«Промпты»</Link> и дополнительный суффикс из настроек.</p>
      </div>
    </section>
  );
}
