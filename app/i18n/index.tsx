"use client";

import { createContext, useContext, type ReactNode } from "react";
import { ru, type Messages } from "./ru";
import { en } from "./en";
import { de } from "./de";
import { fr } from "./fr";
import { es } from "./es";
import { it } from "./it";
import { pt } from "./pt";
import { zh } from "./zh";
import { ja } from "./ja";
import { ko } from "./ko";
import { tr } from "./tr";
import type { PromptTemplate, TaskType } from "../lib";

// Interface dictionaries keyed by the same codes as LANGUAGES in ../lib.ts.
const DICTIONARIES: Record<string, Messages> = { ru, en, de, fr, es, it, pt, zh, ja, ko, tr };

// BCP 47 locales used for Intl formatting (dates, numbers, uppercase rules).
const LOCALES: Record<string, string> = {
  ru: "ru-RU",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  tr: "tr-TR",
};

export interface I18n {
  language: string;
  locale: string;
  t: Messages;
}

export function isInterfaceLanguage(code: unknown): code is string {
  return typeof code === "string" && Object.prototype.hasOwnProperty.call(DICTIONARIES, code);
}

// Unsupported or missing codes fall back to Russian, the original interface language.
export function createI18n(language: string): I18n {
  const code = isInterfaceLanguage(language) ? language : "ru";
  return { language: code, locale: LOCALES[code], t: DICTIONARIES[code] };
}

const I18nContext = createContext<I18n>(createI18n("ru"));

export const I18nProvider = I18nContext.Provider;

export function useI18n(): I18n {
  return useContext(I18nContext);
}

// UI label for a task type. Model prompts keep using taskTypeLabel() from ../lib.
export function taskTypeName(t: Messages, taskType: TaskType): string {
  switch (taskType) {
    case "words": return t.labels.taskTypes.words;
    case "paste-blank": return t.labels.taskTypes.pasteBlank;
    case "test": return t.labels.taskTypes.test;
    default: return t.labels.taskTypes.sentence;
  }
}

// Renders a translated sentence that contains a single `{link}` placeholder.
export function withLink(template: string, link: ReactNode): ReactNode {
  const [before, after = ""] = template.split("{link}");
  return <>{ before }{ link }{ after }</>;
}

export type BuiltinPromptId = "grammar" | "syntax" | "vocabulary" | "examples";
const BUILTIN_PROMPT_IDS: readonly BuiltinPromptId[] = ["grammar", "syntax", "vocabulary", "examples"];

function isBuiltinPromptId(id: string): id is BuiltinPromptId {
  return (BUILTIN_PROMPT_IDS as readonly string[]).includes(id);
}

// Built-in prompt templates in the given interface language, in their default order.
export function defaultPrompts(language: string): PromptTemplate[] {
  const { builtinPrompts } = createI18n(language).t.defaults;
  return BUILTIN_PROMPT_IDS.map((id) => ({
    id,
    title: builtinPrompts[id].title,
    body: builtinPrompts[id].body,
    enabled: true,
    builtin: true,
  }));
}

// A stored text that still equals some language's untouched default follows the current interface language.
// Anything the learner wrote is kept as is.
function localizeUntouched(value: string, pick: (defaults: Messages["defaults"]) => string, language: string): string {
  const trimmed = value.trim();
  const untouched = Object.values(DICTIONARIES).some((dictionary) => pick(dictionary.defaults).trim() === trimmed);
  return untouched ? pick(createI18n(language).t.defaults) : value;
}

export function localizeSystemPrompt(value: string, language: string): string {
  return localizeUntouched(value, (defaults) => defaults.systemPrompt, language);
}

export function localizePrompts(prompts: PromptTemplate[], language: string): PromptTemplate[] {
  return prompts.map((prompt) => {
    const id = prompt.id;
    if (!prompt.builtin || !isBuiltinPromptId(id)) return prompt;
    return {
      ...prompt,
      title: localizeUntouched(prompt.title, (defaults) => defaults.builtinPrompts[id].title, language),
      body: localizeUntouched(prompt.body, (defaults) => defaults.builtinPrompts[id].body, language),
    };
  });
}
