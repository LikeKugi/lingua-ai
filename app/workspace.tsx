"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cloneElement, FormEvent, isValidElement, MouseEvent as ReactMouseEvent, ReactElement, ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BUILTIN_PROMPTS, DEFAULT_SYSTEM_PROMPT, defaultLanguage, defaultSettings, dateLabel,
  buildMessages, LANGUAGES, languageLabel, validBaseUrl,
  type HistoryItem, type PromptTemplate, type Settings, type TaskType,
} from "./lib";

type Draft = { taskType: TaskType; words: string[]; sentence: string; userAnswer: string; correctAnswer: string };
type Toast = { text: string; kind: "success" | "error" | "info" };
const blankDraft = (): Draft => ({ taskType: "sentence", words: [], sentence: "", userAnswer: "", correctAnswer: "" });
const PAGES = [
  { href: "/", title: "Разбор", key: "explain", symbol: "✳" },
  { href: "/history", title: "История", key: "history", symbol: "◷" },
  { href: "/prompts", title: "Промпты", key: "prompts", symbol: "☷" },
  { href: "/instruction", title: "Инструкция", key: "instruction", symbol: "≡" },
  { href: "/settings", title: "Настройки", key: "settings", symbol: "⚙" },
];

function parseInline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern = /(\*\*.+?\*\*|__.+?__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) result.push(text.slice(last, index));
    const token = match[0];
    if (token.startsWith("**") || token.startsWith("__")) result.push(<strong key={`${index}-b`}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) result.push(<code key={`${index}-c`}>{token.slice(1, -1)}</code>);
    else result.push(<em key={`${index}-i`}>{token.slice(1, -1)}</em>);
    last = index + token.length;
  }
  if (last < text.length) result.push(text.slice(last));
  return result;
}

function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let ordered = false;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push(<p key={`p-${blocks.length}`}>{paragraph.map(parseInline).map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(<Tag key={`list-${blocks.length}`}>{list.map((item, i) => <li key={i}>{parseInline(item)}</li>)}</Tag>);
    list = [];
  };
  lines.forEach((line) => {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const item = /^\s*([-*+] |\d+\. )(.+)$/.exec(line);
    if (heading) { flushParagraph(); flushList(); blocks.push(<h3 key={`h-${blocks.length}`}>{parseInline(heading[2])}</h3>); }
    else if (item) {
      flushParagraph();
      const nextOrdered = /^\s*\d/.test(line);
      if (list.length && nextOrdered !== ordered) flushList();
      ordered = nextOrdered;
      list.push(item[2]);
    } else if (!line.trim()) { flushParagraph(); flushList(); }
    else { flushList(); paragraph.push(line); }
  });
  flushParagraph(); flushList();
  return <div className="markdown">{blocks}</div>;
}

function Field({ label, children, hint, className = "", controlId }: { label: string; children: ReactNode; hint?: string; className?: string; controlId?: string }) {
  const generatedId = `field-${useId().replace(/:/g, "")}`;
  const id = controlId ?? generatedId;
  const isNativeControl = isValidElement(children) && typeof children.type === "string" && ["input", "select", "textarea"].includes(children.type);
  const control = isNativeControl ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children;
  return <div className={`field ${className}`}><label className="field-label" htmlFor={isNativeControl || controlId ? id : undefined} id={`${id}-label`}>{label}</label>{isNativeControl ? control : <div className="field-control" role="group" aria-labelledby={`${id}-label`}>{children}</div>}{hint && <div className="field-hint">{hint}</div>}</div>;
}

export default function Workspace() {
  const pathname = usePathname();
  const page = PAGES.find((entry) => entry.href === pathname)?.key ?? "explain";
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [prompts, setPrompts] = useState<PromptTemplate[]>(BUILTIN_PROMPTS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [hydrated, setHydrated] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [requestBusy, setRequestBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState<"models" | "check" | null>(null);
  const [providerStatus, setProviderStatus] = useState("");
  const [providerStatusTone, setProviderStatusTone] = useState<"success" | "error" | "info">("info");
  const [explanationError, setExplanationError] = useState("");
  const [explanation, setExplanation] = useState<HistoryItem | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [online, setOnline] = useState(true);
  const [installInstructions, setInstallInstructions] = useState("В меню браузера выберите «Добавить на главный экран». Для установки требуется HTTPS; на localhost установка доступна во время разработки.");
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [promptForm, setPromptForm] = useState({ title: "", body: "" });
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState({ title: "", body: "" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyModalRef = useRef<HTMLElement | null>(null);

  const showToast = (text: string, kind: Toast["kind"] = "info") => {
    setToast({ text, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    const hydrate = () => {
      try {
        const savedSettings = localStorage.getItem("settings:v1");
        const savedPrompts = localStorage.getItem("prompts:v1");
        const savedHistory = localStorage.getItem("history:v1");
        const savedDraft = localStorage.getItem("draft:v1");
        const savedKey = localStorage.getItem("apiKey") ?? "";
        const parsedSettings = savedSettings ? JSON.parse(savedSettings) as Partial<Settings> : {};
        setSettings({ ...defaultSettings(), ...parsedSettings, language: parsedSettings.language ?? defaultLanguage() });
        if (savedPrompts) {
          const parsed = JSON.parse(savedPrompts) as PromptTemplate[];
          setPrompts([...BUILTIN_PROMPTS.map((builtin) => ({ ...builtin, ...(parsed.find((item) => item.id === builtin.id) ?? {}) })), ...parsed.filter((item) => !item.builtin)]);
        }
        if (savedHistory) setHistory(JSON.parse(savedHistory) as HistoryItem[]);
        if (savedDraft) setDraft({ ...blankDraft(), ...(JSON.parse(savedDraft) as Partial<Draft>) });
        setApiKey(savedKey);
        setKeyDraft(savedKey);
      } catch {
        window.setTimeout(() => showToast("Не удалось прочитать часть данных браузера. Проверьте доступное место для хранения.", "error"), 0);
      }
      setHydrated(true);
      setOnline(navigator.onLine);
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setInstallInstructions("В Safari нажмите «Поделиться», затем выберите «На экран Домой». Для опубликованного сайта нужен HTTPS; localhost подходит для разработки.");
      else if (/android/i.test(navigator.userAgent)) setInstallInstructions("В меню Chrome выберите «Установить приложение» или «Добавить на главный экран». Для опубликованного сайта нужен HTTPS; localhost подходит для разработки.");
      else setInstallInstructions("В меню браузера выберите «Установить приложение» или «Добавить на главный экран». Для опубликованного сайта нужен HTTPS; localhost подходит для разработки.");
    };
    const hydrationTimer = window.setTimeout(hydrate, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
    };
  // Hydrate browser-only data once; persistence is handled below.
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("settings:v1", JSON.stringify(settings));
      localStorage.setItem("prompts:v1", JSON.stringify(prompts));
      localStorage.setItem("history:v1", JSON.stringify(history));
      localStorage.setItem("draft:v1", JSON.stringify(draft));
    } catch { window.setTimeout(() => showToast("Браузер не смог сохранить изменения. Освободите место в хранилище.", "error"), 0); }
  }, [hydrated, settings, prompts, history, draft]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedHistory(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!selectedHistory) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = historyModalRef.current;
    modal?.querySelector<HTMLElement>(".modal-close")?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !modal) return;
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if (!focusable.length) { event.preventDefault(); modal.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trapFocus);
    return () => { document.removeEventListener("keydown", trapFocus); if (returnFocus?.isConnected) returnFocus.focus(); };
  }, [selectedHistory]);

  const missing = useMemo(() => {
    const needs = [];
    if (!(draft.taskType === "words" ? draft.words.some((word) => word.trim()) : draft.sentence.trim())) needs.push("задание");
    if (!draft.userAnswer.trim()) needs.push("ваш вариант");
    if (!draft.correctAnswer.trim()) needs.push("правильный вариант");
    if (!apiKey.trim()) needs.push("ключ API");
    if (!settings.baseUrl.trim()) needs.push("адрес сервиса");
    if (!settings.model.trim()) needs.push("модель");
    return needs;
  }, [draft, apiKey, settings.baseUrl, settings.model]);

  const changeTaskType = (taskType: TaskType) => { if (draft.taskType !== taskType) setDraft({ ...blankDraft(), taskType, words: taskType === "words" ? ["", ""] : [] }); };
  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const navigateOffline = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (!online) { event.preventDefault(); window.location.assign(href); }
  };

  const providerError = (status: number, code?: string) => {
    if (code === "invalid_url") return "Укажите корректный адрес сервиса, начинающийся с http:// или https://.";
    if (code === "missing_key") return "Введите ключ API перед проверкой подключения.";
    if (code === "missing_model") return "Выберите модель в настройках.";
    if (status === 401) return "Сервис отклонил ключ. Проверьте его и попробуйте снова.";
    if (status === 404) return "Сервис не нашёл адрес моделей или выбранную модель.";
    if (code === "timeout") return "Сервис не ответил вовремя. Проверьте соединение и повторите попытку.";
    if (code === "network") return "Не удалось связаться с сервисом. Проверьте интернет и адрес.";
    if (code === "empty_response") return "Модель вернула пустой ответ. Попробуйте другую модель.";
    return "Запрос не выполнен. Проверьте адрес, ключ и настройки модели.";
  };

  const requestModels = async (mode: "models" | "check") => {
    const key = keyDraft.trim();
    if (!key) { setProviderStatus("Введите ключ API для продолжения."); setProviderStatusTone("error"); showToast("Сначала введите ключ API.", "error"); return; }
    if (!validBaseUrl(settings.baseUrl)) { setProviderStatus(providerError(0, "invalid_url")); setProviderStatusTone("error"); return; }
    setSettingsBusy(mode);
    setProviderStatus(mode === "models" ? "Загружаем список моделей…" : "Проверяем соединение…");
    setProviderStatusTone("info");
    try {
      const response = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey: key }), signal: AbortSignal.timeout(25000), cache: "no-store" });
      const data = await response.json() as { models?: string[]; error?: string; code?: string };
      if (!response.ok) throw Object.assign(new Error(providerError(response.status, data.code)), { safeMessage: providerError(response.status, data.code) });
      const found = Array.isArray(data.models) ? data.models : [];
      setModels(found);
      if (keyDraft.trim()) {
        try { localStorage.setItem("apiKey", key); setApiKey(key); setKeyDraft(key); }
        catch { setProviderStatus("Проверка пройдена, но ключ не удалось сохранить в браузере."); setProviderStatusTone("error"); showToast("Ключ прошёл проверку, но сохранить его не удалось.", "error"); return; }
      }
      const checkedAt = new Intl.DateTimeFormat("ru-RU", { timeStyle: "short" }).format(new Date());
      setProviderStatus(mode === "models" ? `Найдено моделей: ${found.length}. Проверено в ${checkedAt}.` : `Соединение работает. Найдено моделей: ${found.length}. Проверено в ${checkedAt}.`);
      setProviderStatusTone("success");
      showToast(mode === "models" ? `Список загружен: ${found.length} моделей.` : "Соединение с сервисом работает.", "success");
    } catch (error) {
      const message = error instanceof Error && "safeMessage" in error ? String(error.safeMessage) : error instanceof DOMException && error.name === "TimeoutError" ? providerError(0, "timeout") : providerError(0, "network");
      setProviderStatus(message);
      setProviderStatusTone("error");
      showToast(message, "error");
    } finally { setSettingsBusy(null); }
  };

  const explain = async (event: FormEvent) => {
    event.preventDefault();
    if (missing.length || requestBusy) return;
    if (!validBaseUrl(settings.baseUrl)) { setExplanationError(providerError(0, "invalid_url")); showToast(providerError(0, "invalid_url"), "error"); return; }
    setRequestBusy(true); setExplanation(null); setExplanationError("");
    try {
      const task = draft.taskType === "words" ? draft.words.map((word) => word.trim()).filter(Boolean) : draft.sentence.trim();
      const messages = buildMessages({ settings, prompts, taskType: draft.taskType, task, userAnswer: draft.userAnswer, correctAnswer: draft.correctAnswer });
      const response = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey, model: settings.model, messages }), signal: AbortSignal.timeout(65000), cache: "no-store" });
      const data = await response.json() as { response?: string; error?: string; code?: string };
      if (!response.ok) throw Object.assign(new Error(providerError(response.status, data.code)), { safeMessage: providerError(response.status, data.code) });
      if (!data.response?.trim()) throw Object.assign(new Error(providerError(0, "empty_response")), { safeMessage: providerError(0, "empty_response") });
      const item: HistoryItem = { id: crypto.randomUUID(), createdAt: Date.now(), taskType: draft.taskType, task, userAnswer: draft.userAnswer.trim(), correctAnswer: draft.correctAnswer.trim(), response: data.response, model: settings.model, language: settings.language };
      setHistory((current) => [item, ...current]); setExplanation(item); showToast("Разбор готов и сохранён в истории.", "success");
    } catch (error) {
      const message = error instanceof Error && "safeMessage" in error ? String(error.safeMessage) : error instanceof DOMException && error.name === "TimeoutError" ? providerError(0, "timeout") : providerError(0, "network");
      setExplanationError(message); showToast(message, "error");
    } finally { setRequestBusy(false); }
  };

  const saveKey = () => {
    try { if (keyDraft.trim()) { localStorage.setItem("apiKey", keyDraft.trim()); setApiKey(keyDraft.trim()); showToast("Ключ сохранён в этом браузере.", "success"); } else showToast("Введите ключ API перед сохранением.", "error"); }
    catch { showToast("Не удалось сохранить ключ в браузере.", "error"); }
  };
  const clearKey = () => {
    if (!window.confirm("Удалить сохранённый ключ API из этого браузера?")) return;
    try { localStorage.removeItem("apiKey"); setApiKey(""); setKeyDraft(""); showToast("Ключ удалён.", "success"); }
    catch { showToast("Не удалось удалить ключ.", "error"); }
  };

  const titleByPage: Record<string, [string, string]> = {
    explain: ["Разбор", "Задание, ваш ответ и правильный вариант — объяснение появится ниже."],
    history: ["История", "Сохранённые разборы остаются только в этом браузере."],
    prompts: ["Промпты", "Настройте правила, по которым модель разбирает ваши ошибки."],
    instruction: ["Инструкция", "Основное сообщение преподавателю отправляется вместе с каждым запросом."],
    settings: ["Настройки", "Подключите свой сервис и выберите язык объяснений."],
  };

  return <div className="app-frame">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="Лингва — на страницу разбора"><span className="brand-mark">л</span><span>ЛИНГВА</span></Link>
      <p className="sidebar-caption">ПРОСТРАНСТВО ДЛЯ УЧЁБЫ</p>
      <nav className="main-nav" aria-label="Основная навигация">
        {PAGES.map((item) => <Link key={item.key} href={item.href} onClick={(event) => navigateOffline(event, item.href)} className={`nav-link ${page === item.key ? "active" : ""}`} aria-current={page === item.key ? "page" : undefined}><span className="nav-symbol" aria-hidden="true">{item.symbol}</span><span>{item.title}</span>{item.key === "history" && history.length > 0 && <span className="nav-count">{history.length > 99 ? "99+" : history.length}</span>}</Link>)}
      </nav>
      <div className="sidebar-bottom">
        <div className={`connection-pill ${online ? "" : "offline"}`}><span className="status-dot" />{online ? "Вы в сети" : "Нет подключения"}</div>
        <p>Ваши записи и настройки хранятся на этом устройстве.</p>
      </div>
    </aside>
    <div className="app-main">
      <header className="mobile-header"><Link className="brand" href="/"><span className="brand-mark">л</span><span>ЛИНГВА</span></Link><span className={`mobile-online ${online ? "" : "offline"}`}><span className="status-dot" />{online ? "В сети" : "Офлайн"}</span></header>
      {!online && <div className="offline-banner" role="status"><span aria-hidden="true">⌁</span><span><b>Вы не в сети.</b> Интерфейс и сохранённые записи доступны; для нового разбора нужен интернет.</span></div>}
      <main className="main-content" id="main-content">
        <div className="page-heading"><div><p className="eyebrow">ЛИНГВА <span>/</span> {titleByPage[page][0].toLocaleUpperCase("ru-RU")}</p><h1>{titleByPage[page][0]}</h1><p className="page-lede">{titleByPage[page][1]}</p></div>
          {page === "history" && history.length > 0 && <button className="button button-quiet-danger" onClick={() => { if (window.confirm("Удалить все сохранённые разборы? Это действие нельзя отменить.")) { setHistory([]); setSelectedHistory(null); showToast("История очищена.", "success"); } }}>Очистить</button>}
        </div>

        {page === "explain" && <section className="explain-page">
          <form onSubmit={explain} className="workspace-card form-card">
            <div className="task-switch" role="tablist" aria-label="Тип задания">
              <button type="button" role="tab" aria-selected={draft.taskType === "sentence"} className={draft.taskType === "sentence" ? "selected" : ""} onClick={() => changeTaskType("sentence")}>Предложение</button>
              <button type="button" role="tab" aria-selected={draft.taskType === "words"} className={draft.taskType === "words" ? "selected" : ""} onClick={() => changeTaskType("words")}>Слова</button>
            </div>
            {draft.taskType === "words" ? <Field label="Слова для задания" hint="Введите слова или фразы, из которых нужно составить предложение.">
              <div className="word-list">{draft.words.map((word, index) => <div className="word-input" key={index}><span className="word-index">{String(index + 1).padStart(2, "0")}</span><input aria-label={`Слово ${index + 1}`} value={word} onChange={(event) => updateDraft("words", draft.words.map((item, i) => i === index ? event.target.value : item))} placeholder={index === 0 ? "например, she" : index === 1 ? "например, go to work" : "Добавьте слово или фразу"} /><button className="icon-button remove-word" type="button" disabled={draft.words.length <= 1} onClick={() => updateDraft("words", draft.words.filter((_, i) => i !== index))} aria-label={`Удалить слово ${index + 1}`}>×</button></div>)}
                <button className="add-word" type="button" onClick={() => updateDraft("words", [...draft.words, ""])}><span>＋</span> Добавить слово</button>
              </div>
            </Field> : <Field label="Исходное предложение" hint="Предложение, которое нужно перевести или преобразовать."><textarea className="text-area source-area" rows={3} value={draft.sentence} onChange={(event) => updateDraft("sentence", event.target.value)} placeholder="Введите исходное предложение…" /></Field>}
            <div className="answer-grid">
              <Field label="Ваш вариант"><textarea className="text-area learner-area" rows={4} value={draft.userAnswer} onChange={(event) => updateDraft("userAnswer", event.target.value)} placeholder="Напишите свой ответ…" /></Field>
              <Field label="Правильный вариант"><textarea className="text-area correct-area" rows={4} value={draft.correctAnswer} onChange={(event) => updateDraft("correctAnswer", event.target.value)} placeholder="Введите правильный ответ…" /></Field>
            </div>
            {missing.length > 0 && <div className="missing-note"><span className="missing-mark" aria-hidden="true">i</span><span>Чтобы начать, добавьте {missing.join(", ")}. {(!apiKey || !settings.model) && <>Настроить подключение можно в <Link href="/settings">настройках</Link>.</>}</span></div>}
            {!online && <div className="inline-alert" role="status">Сейчас нет интернета. Черновик сохранён, отправить запрос можно после подключения.</div>}
            <div className="submit-row"><button className="button button-primary" type="submit" disabled={Boolean(missing.length) || requestBusy || !online}><span>{requestBusy ? "Разбираем ошибку…" : "Разобрать ошибку"}</span><span className="button-arrow" aria-hidden="true">↗</span></button><span className="submit-caption">Ваши ответы сохраняются в истории на этом устройстве.</span></div>
          </form>
          {explanationError && <div className="inline-alert" role="alert">{explanationError}</div>}
          {requestBusy && <div className="loading-card" role="status"><span className="loader" /><span><b>Ищем причину ошибки</b><small>Сравниваем ваш ответ с правильным вариантом…</small></span></div>}
          {explanation && <article className="workspace-card result-card"><div className="result-top"><div><p className="eyebrow">РАЗБОР ОШИБКИ</p><h2>Почему ответ отличается</h2></div><span className="result-date">{dateLabel(explanation.createdAt)}</span></div><div className="result-rule" /><div className="result-answers"><div><span>ВАШ ВАРИАНТ</span><p>{explanation.userAnswer}</p></div><div><span>ПРАВИЛЬНО</span><p>{explanation.correctAnswer}</p></div></div><Markdown source={explanation.response} /><div className="result-meta"><span>{explanation.model}</span><span>·</span><span>Ответ на языке: {languageLabel(explanation.language)}</span></div></article>}
          {!explanation && !requestBusy && <div className="quiet-note"><span className="note-glyph">✳</span><p>Хороший разбор помогает заметить правило, а не просто запомнить правильный ответ.</p></div>}
        </section>}

        {page === "history" && <section className="history-list" aria-label="Сохранённые разборы">
          {history.length === 0 ? <div className="empty-state workspace-card"><span className="empty-illustration" aria-hidden="true">↗</span><h2>Здесь появятся ваши разборы</h2><p>После первого объяснения вы сможете вернуться к нему в любое время. Записи хранятся только в этом браузере.</p><Link className="button button-primary" href="/">Начать разбор <span className="button-arrow">↗</span></Link></div> : history.map((item) => <article key={item.id} className="history-card workspace-card"><button className="history-open" onClick={() => setSelectedHistory(item)} aria-label={`Открыть разбор от ${dateLabel(item.createdAt)}`}><div className="history-card-top"><span className="type-badge">{item.taskType === "words" ? "СЛОВА" : "ПРЕДЛОЖЕНИЕ"}</span><time>{dateLabel(item.createdAt)}</time></div><h2>{Array.isArray(item.task) ? item.task.filter(Boolean).join(" · ") : item.task}</h2><p className="history-answer"><span>ВАШ ОТВЕТ</span> {item.userAnswer}</p><p className="history-preview">{item.response.replace(/[#*_`]/g, "").slice(0, 190)}{item.response.length > 190 ? "…" : ""}</p><div className="history-card-bottom"><span>{item.model} · {languageLabel(item.language)}</span><span className="open-arrow">Открыть ↗</span></div></button><button className="icon-button history-delete" onClick={() => { if (window.confirm("Удалить этот разбор из истории?")) { setHistory((current) => current.filter((record) => record.id !== item.id)); showToast("Разбор удалён.", "success"); } }} aria-label="Удалить разбор">×</button></article>)}</section>}

        {page === "prompts" && <section className="prompt-list">
          <div className="section-intro"><div><span className="section-kicker">ПРАВИЛА РАЗБОРА</span><h2>На что обратить внимание</h2></div><p>Включённые правила добавляются к системной инструкции каждого нового запроса.</p></div>
          {prompts.map((prompt) => <article className={`prompt-card workspace-card ${prompt.enabled ? "" : "disabled-prompt"}`} key={prompt.id}>
            {editingPrompt === prompt.id ? <form onSubmit={(event) => { event.preventDefault(); if (!editingValue.title.trim() || !editingValue.body.trim()) { showToast("Заполните название и текст правила.", "error"); return; } setPrompts((current) => current.map((item) => item.id === prompt.id ? { ...item, title: editingValue.title.trim(), body: editingValue.body.trim() } : item)); setEditingPrompt(null); showToast("Правило обновлено.", "success"); }}>
              <Field label="Название"><input className="text-input" value={editingValue.title} onChange={(event) => setEditingValue((current) => ({ ...current, title: event.target.value }))} /></Field><Field label="Инструкция"><textarea className="text-area" rows={3} value={editingValue.body} onChange={(event) => setEditingValue((current) => ({ ...current, body: event.target.value }))} /></Field><div className="inline-actions"><button className="button button-primary button-small">Сохранить</button><button className="button button-outline button-small" type="button" onClick={() => setEditingPrompt(null)}>Отмена</button></div>
            </form> : <><div className="prompt-number">{String(prompts.indexOf(prompt) + 1).padStart(2, "0")}</div><div className="prompt-copy"><div className="prompt-title-line"><h3>{prompt.title}</h3>{prompt.builtin && <span className="builtin-tag">ВСТРОЕННЫЙ</span>}</div><p>{prompt.body}</p></div><div className="prompt-actions"><button className="icon-button edit-button" aria-label={`Редактировать правило «${prompt.title}»`} onClick={() => { setEditingValue({ title: prompt.title, body: prompt.body }); setEditingPrompt(prompt.id); }}>↗</button><label className="switch" aria-label={`${prompt.enabled ? "Отключить" : "Включить"} правило «${prompt.title}»`}><input type="checkbox" checked={prompt.enabled} onChange={() => setPrompts((current) => current.map((item) => item.id === prompt.id ? { ...item, enabled: !item.enabled } : item))} /><span /></label>{!prompt.builtin && <button className="icon-button delete-prompt" aria-label={`Удалить правило «${prompt.title}»`} onClick={() => { if (window.confirm(`Удалить правило «${prompt.title}»?`)) { setPrompts((current) => current.filter((item) => item.id !== prompt.id)); showToast("Правило удалено.", "success"); } }}>×</button>}</div></>}
          </article>)}
          <form className="add-prompt-card" onSubmit={(event) => { event.preventDefault(); if (!promptForm.title.trim() || !promptForm.body.trim()) { showToast("Укажите название и инструкцию для правила.", "error"); return; } setPrompts((current) => [...current, { id: crypto.randomUUID(), title: promptForm.title.trim(), body: promptForm.body.trim(), enabled: true, builtin: false }]); setPromptForm({ title: "", body: "" }); showToast("Новое правило добавлено.", "success"); }}><div className="add-prompt-heading"><span className="add-icon">＋</span><div><h2>Добавить своё правило</h2><p>Создайте дополнительный фокус для разбора.</p></div></div><Field label="Название"><input className="text-input" value={promptForm.title} onChange={(event) => setPromptForm((current) => ({ ...current, title: event.target.value }))} placeholder="Например, Произношение" /></Field><Field label="Инструкция"><textarea className="text-area" rows={3} value={promptForm.body} onChange={(event) => setPromptForm((current) => ({ ...current, body: event.target.value }))} placeholder="Что модель должна проверить?" /></Field><button className="button button-primary button-small">Добавить правило <span className="button-arrow">↗</span></button></form>
        </section>}

        {page === "instruction" && <section className="instruction-page workspace-card"><div className="instruction-overline"><span className="instruction-icon">≡</span><div><span className="section-kicker">ОСНОВА КАЖДОГО РАЗБОРА</span><p>Эту инструкцию вы задаёте модели вместе с заданием, ответами и включёнными правилами.</p></div></div><Field label="Системная инструкция" hint={`${settings.systemPrompt.length.toLocaleString("ru-RU")} символов · сохраняется автоматически`}><textarea className="text-area system-prompt" rows={13} value={settings.systemPrompt} onChange={(event) => updateSetting("systemPrompt", event.target.value)} /></Field><div className="instruction-footer"><span className="saved-inline"><span className="saved-dot" />Изменения сохраняются автоматически</span><button className="button button-outline" onClick={() => { if (window.confirm("Вернуть стандартную инструкцию? Ваши промпты и суффикс останутся без изменений.")) { updateSetting("systemPrompt", DEFAULT_SYSTEM_PROMPT); showToast("Стандартная инструкция восстановлена.", "success"); } }}>Сбросить к стандартной</button></div><div className="privacy-note"><span aria-hidden="true">✳</span><p>В запрос также входят активные правила из раздела <Link href="/prompts">«Промпты»</Link> и дополнительный суффикс из настроек.</p></div></section>}

        {page === "settings" && <section className="settings-grid">
          <div className="settings-main">
            <section className="workspace-card settings-card"><div className="card-heading"><span className="card-index">01</span><div><h2>Подключение к модели</h2><p>Используйте ключ своего OpenAI-совместимого сервиса.</p></div></div><Field label="Базовый URL"><input className="text-input mono-input" type="url" value={settings.baseUrl} onChange={(event) => updateSetting("baseUrl", event.target.value)} placeholder="https://api.openai.com/v1" /></Field><Field label="Ключ API" controlId="api-key-field" hint="Браузер не предоставляет защищённого хранилища. Сохранённый ключ находится в localStorage этого браузера."><div className="key-field"><input id="api-key-field" aria-label="Ключ API" className="text-input mono-input" type={keyVisible ? "text" : "password"} autoComplete="off" value={keyDraft} onChange={(event) => setKeyDraft(event.target.value)} placeholder={apiKey ? "Ключ сохранён — введите замену" : "Введите ключ API"} /><button type="button" className="key-toggle" onClick={() => setKeyVisible((value) => !value)}>{keyVisible ? "Скрыть" : "Показать"}</button></div><div className="key-status"><span className={`saved-dot ${apiKey ? "" : "empty"}`} />{apiKey ? "Ключ сохранён в этом браузере" : "Ключ ещё не сохранён"}</div><div className="inline-actions key-actions"><button className="button button-outline button-small" type="button" onClick={saveKey}>Сохранить ключ</button>{apiKey && <button className="text-danger" type="button" onClick={clearKey}>Удалить ключ</button>}</div></Field><Field label="Модель"><select className="text-input" value={settings.model} onChange={(event) => updateSetting("model", event.target.value)}><option value="">Выберите модель</option>{settings.model && !models.includes(settings.model) && <option value={settings.model}>{settings.model} · текущая</option>}{models.map((model) => <option key={model} value={model}>{model}</option>)}</select></Field><div className="model-actions"><button className="button button-outline button-small" type="button" onClick={() => requestModels("models")} disabled={Boolean(settingsBusy)}>{settingsBusy === "models" ? <><span className="mini-loader" />Загружаем…</> : "Загрузить модели"}</button><button className="button button-soft button-small" type="button" onClick={() => requestModels("check")} disabled={Boolean(settingsBusy)}>{settingsBusy === "check" ? <><span className="mini-loader" />Проверяем…</> : "Проверить подключение"}</button></div>{providerStatus && <div className={`provider-feedback ${providerStatusTone === "error" ? "feedback-error" : providerStatusTone === "info" ? "feedback-info" : ""}`} role="status">{providerStatus}</div>}<p className="provider-hint">Поддерживаются OpenAI, OpenRouter, Groq, Together, DeepSeek, Mistral, Ollama и LM Studio.</p></section>
            <section className="workspace-card settings-card"><div className="card-heading"><span className="card-index">02</span><div><h2>Язык ответа</h2><p>Язык объяснения выбирается отдельно от языка задания.</p></div></div><Field label="Отвечать на языке"><select className="text-input language-select" value={settings.language} onChange={(event) => updateSetting("language", event.target.value)}>{LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></Field><div className="field suffix-field"><Field label="Дополнительная инструкция" hint="Добавляется после активных правил и перед указанием языка ответа."><textarea className="text-area" rows={4} value={settings.suffix} onChange={(event) => updateSetting("suffix", event.target.value)} placeholder="Например: используй короткие примеры из повседневной речи…" /></Field></div></section>
          </div>
          <aside className="settings-aside"><div className="provider-note"><span className="provider-note-icon">✳</span><span className="section-kicker">ВАШ ВЫБОР</span><h2>Вы выбираете модель и оплачиваете её напрямую.</h2><p>Лингва бесплатна и не добавляет подписок или платы за запросы. Стоимость использования определяет ваш провайдер.</p></div><div className="privacy-card"><span className="privacy-lock" aria-hidden="true">⌑</span><h3>Данные остаются у вас</h3><p>История, инструкции и настройки хранятся в браузере. Ключ отправляется только на сервер Лингвы при проверке или запросе, а оттуда — выбранному сервису.</p><Link href="/instruction">Как формируется запрос <span>↗</span></Link></div>{installPrompt ? <button className="install-card" onClick={async () => { const prompt = installPrompt as Event & { prompt?: () => Promise<void> }; await prompt.prompt?.(); setInstallPrompt(null); }}><span>＋</span><b>Установить Лингву</b><small>Добавить приложение на устройство</small></button> : <div className="install-note"><span className="install-note-mark">↗</span><h3>Установка приложения</h3><p>{installInstructions}</p></div>}</aside>
        </section>}
      </main>
    </div>
    <nav className="bottom-nav" aria-label="Основная навигация для телефона">{PAGES.map((item) => <Link href={item.href} onClick={(event) => navigateOffline(event, item.href)} key={item.key} className={page === item.key ? "active" : ""} aria-current={page === item.key ? "page" : undefined}><span aria-hidden="true">{item.symbol}</span><small>{item.title}</small></Link>)}</nav>
    {toast && <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}><span className="toast-mark">{toast.kind === "success" ? "✓" : toast.kind === "error" ? "!" : "i"}</span>{toast.text}<button onClick={() => setToast(null)} aria-label="Закрыть уведомление">×</button></div>}
    {selectedHistory && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedHistory(null); }}><section ref={historyModalRef} tabIndex={-1} className="history-modal workspace-card" role="dialog" aria-modal="true" aria-labelledby="history-modal-title"><div className="modal-head"><div><span className="type-badge">{selectedHistory.taskType === "words" ? "СЛОВА" : "ПРЕДЛОЖЕНИЕ"}</span><h2 id="history-modal-title">Разбор ошибки</h2><time>{dateLabel(selectedHistory.createdAt)}</time></div><button className="icon-button modal-close" onClick={() => setSelectedHistory(null)} aria-label="Закрыть">×</button></div><div className="modal-task"><span>ЗАДАНИЕ</span><p>{Array.isArray(selectedHistory.task) ? selectedHistory.task.filter(Boolean).join(" · ") : selectedHistory.task}</p></div><div className="result-answers"><div><span>ВАШ ВАРИАНТ</span><p>{selectedHistory.userAnswer}</p></div><div><span>ПРАВИЛЬНО</span><p>{selectedHistory.correctAnswer}</p></div></div><div className="result-rule" /><Markdown source={selectedHistory.response} /><div className="result-meta"><span>{selectedHistory.model}</span><span>·</span><span>Ответ на языке: {languageLabel(selectedHistory.language)}</span></div></section></div>}
  </div>;
}
