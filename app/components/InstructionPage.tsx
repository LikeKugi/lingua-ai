"use client";

import Link from "next/link";
import type { Settings } from "../lib";
import { Field } from "./ui";
import type { Toast } from "./types";
import { useI18n, withLink } from "../i18n";

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
  const { t, locale } = useI18n();
  return (
    <section className="instruction-page workspace-card">
      <div className="instruction-overline">
        <span className="instruction-icon">≡</span>
        <div>
          <span className="section-kicker">{ t.instruction.kicker }</span>
          <p>{ t.instruction.lede }</p>
        </div>
      </div>
      <Field
        label={ t.instruction.systemLabel }
        hint={ t.instruction.charsCount(settings.systemPrompt.length.toLocaleString(locale)) }
      >
        <textarea
          className="text-area system-prompt"
          rows={ 13 }
          value={ settings.systemPrompt }
          onChange={ (event) => updateSetting("systemPrompt", event.target.value) }
        />
      </Field>
      <div className="instruction-footer">
        <span className="saved-inline"><span className="saved-dot" />{ t.instruction.savedAuto }</span>
        <button
          className="button button-outline"
          onClick={ () => {
            if (window.confirm(t.instruction.resetConfirm)) {
              updateSetting("systemPrompt", t.defaults.systemPrompt);
              showToast(t.instruction.resetDone, "success");
            }
          } }
        >{ t.instruction.resetBtn }
        </button>
      </div>
      <div className="privacy-note">
        <span aria-hidden="true">✳</span>
        <p>{ withLink(t.instruction.note, <Link href="/prompts">{ t.nav.prompts }</Link>) }</p>
      </div>
    </section>
  );
}
