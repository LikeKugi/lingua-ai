export type TaskType = "words" | "sentence";

export type HistoryItem = {
  id: string;
  createdAt: number;
  taskType: TaskType;
  task: string | string[];
  userAnswer: string;
  correctAnswer: string;
  response: string;
  model: string;
  language: string;
};

export type PromptTemplate = {
  id: string;
  title: string;
  body: string;
  enabled: boolean;
  builtin: boolean;
};

export type Settings = {
  baseUrl: string;
  model: string;
  language: string;
  suffix: string;
  systemPrompt: string;
};

export const DEFAULT_SYSTEM_PROMPT = `Ты — опытный преподаватель иностранных языков.
Твоя задача — объяснять учащемуся его ошибки.
Ты должен:
- разобрать грамматику (почему форма слова неверна),
- разобрать синтаксис (почему порядок/структура неверны),
- разобрать лексику (почему слово не подходит по смыслу),
- предложить корректный вариант и кратко пояснить правило.
Отвечай дружелюбно, структурировано, без воды.`;

export const BUILTIN_PROMPTS: PromptTemplate[] = [
  { id: "grammar", title: "Грамматика", body: "Обрати особое внимание на грамматические ошибки: времена, согласование, падежи, артикли.", enabled: true, builtin: true },
  { id: "syntax", title: "Синтаксис", body: "Проверь порядок слов, структуру предложения, согласование подлежащего и сказуемого.", enabled: true, builtin: true },
  { id: "vocabulary", title: "Лексика", body: "Проверь уместность выбранных слов, коллокации, идиоматичность.", enabled: true, builtin: true },
  { id: "examples", title: "Примеры", body: "Приведи 2–3 примера корректного употребления правила.", enabled: true, builtin: true },
];

export const LANGUAGES = [
  ["ru", "Русский"], ["en", "English"], ["de", "Deutsch"], ["fr", "Français"],
  ["es", "Español"], ["it", "Italiano"], ["pt", "Português"], ["zh", "中文"],
  ["ja", "日本語"], ["ko", "한국어"],
] as const;

export function defaultLanguage() {
  if (typeof navigator === "undefined") return "ru";
  const language = navigator.language.toLowerCase().split("-")[0];
  return LANGUAGES.some(([code]) => code === language) ? language : "ru";
}

export function languageLabel(code: string) {
  return LANGUAGES.find(([id]) => id === code)?.[1] ?? "Русский";
}

export function defaultSettings(): Settings {
  return { baseUrl: "https://api.openai.com/v1", model: "", language: "ru", suffix: "", systemPrompt: DEFAULT_SYSTEM_PROMPT };
}

export function validBaseUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function dateLabel(timestamp: number) {
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeStyle: "short" }).format(new Date(timestamp));
}

export function buildMessages(input: {
  settings: Settings;
  prompts: PromptTemplate[];
  taskType: TaskType;
  task: string | string[];
  userAnswer: string;
  correctAnswer: string;
}) {
  const label = languageLabel(input.settings.language);
  const promptSections = [
    input.settings.systemPrompt.trim(),
    ...input.prompts.filter((prompt) => prompt.enabled).map((prompt) => `${prompt.title.trim()}: ${prompt.body.trim()}`),
    input.settings.suffix.trim(),
    `Ответ дай структурировано и на языке: ${label}.`,
  ].filter(Boolean);
  const taskLine = input.taskType === "words"
    ? `Задание: составить предложение из слов: [${(input.task as string[]).map((word) => word.trim()).filter(Boolean).join(", ")}]`
    : `Задание: исходное предложение — «${input.task}»`;
  return [
    { role: "system", content: promptSections.join("\n\n") },
    { role: "user", content: `${taskLine}\nМой вариант: «${input.userAnswer.trim()}»\nПравильный вариант: «${input.correctAnswer.trim()}»\n\nОбъясни, в чём именно я ошибся: разбери грамматику, синтаксис и лексику.\nОтвет дай структурировано и на языке: ${label}.` },
  ];
}
