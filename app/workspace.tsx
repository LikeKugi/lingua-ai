'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  BUILTIN_PROMPTS, defaultLanguage, defaultSettings, dateLabel,
  buildMessages, languageLabel, validBaseUrl, taskToText,
  isWordsTask, isPasteBlankTask, isTestTask,
  type HistoryItem, type PromptTemplate, type Settings, type TaskType,
} from './lib';
import { Markdown } from './components/ui';
import {
  STORAGE_KEYS, readJson, readRaw, writeJson, writeRaw, removeKey,
} from './utils/storage';
import { maskSecret, unmaskSecret } from './utils/mask';
import { isDraftWords, isDraftPasteBlank, isDraftTest, type Draft, type Toast } from './components/types';
import ExplainPage from './components/ExplainPage';
import HistoryPage from './components/HistoryPage';
import PromptsPage from './components/PromptsPage';
import InstructionPage from './components/InstructionPage';
import SettingsPage from './components/SettingsPage';

const blankDraft = (): Draft => ({ taskType: 'sentence', words: [], sentence: '', blankTask: [], testText: '', testVariants: [], userAnswer: '', correctAnswer: '' });
const PAGES = [
  { href: '/', title: 'Разбор', key: 'explain', symbol: '✳' },
  { href: '/history', title: 'История', key: 'history', symbol: '◷' },
  { href: '/prompts', title: 'Промпты', key: 'prompts', symbol: '☷' },
  { href: '/instruction', title: 'Инструкция', key: 'instruction', symbol: '≡' },
  { href: '/settings', title: 'Настройки', key: 'settings', symbol: '⚙' },
];

export default function Workspace() {
  const pathname = usePathname();
  const page = PAGES.find((entry) => entry.href === pathname)?.key ?? 'explain';
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [prompts, setPrompts] = useState<PromptTemplate[]>(BUILTIN_PROMPTS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [hydrated, setHydrated] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [requestBusy, setRequestBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState<'models' | 'check' | null>(null);
  const [providerStatus, setProviderStatus] = useState('');
  const [providerStatusTone, setProviderStatusTone] = useState<'success' | 'error' | 'info'>('info');
  const [explanationError, setExplanationError] = useState('');
  const [explanation, setExplanation] = useState<HistoryItem | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [online, setOnline] = useState(true);
  const [installInstructions, setInstallInstructions] = useState('В меню браузера выберите «Добавить на главный экран». Для установки требуется HTTPS; на localhost установка доступна во время разработки.');
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [promptForm, setPromptForm] = useState({ title: '', body: '' });
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState({ title: '', body: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyModalRef = useRef<HTMLElement | null>(null);

  const showToast = (text: string, kind: Toast['kind'] = 'info') => {
    setToast({ text, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    const hydrate = async () => {
      try {
        const savedSettings = readJson<Partial<Settings>>(STORAGE_KEYS.settings);
        const savedPrompts = readJson<PromptTemplate[]>(STORAGE_KEYS.prompts);
        const savedHistory = readJson<HistoryItem[]>(STORAGE_KEYS.history);
        const savedDraft = readJson<Partial<Draft>>(STORAGE_KEYS.draft);
        const savedKey = await unmaskSecret(readRaw(STORAGE_KEYS.apiKey) ?? '');
        const parsedSettings = savedSettings ?? {};
        const restoredBaseUrl = await unmaskSecret(parsedSettings.baseUrl ?? '');
        setSettings({
          ...defaultSettings(), ...parsedSettings,
          baseUrl: restoredBaseUrl,
          language: parsedSettings.language ?? defaultLanguage()
        });
        if (savedPrompts) {
          const parsed = savedPrompts;
          setPrompts([...BUILTIN_PROMPTS.map((builtin) => ({ ...builtin, ...(parsed.find((item) => item.id === builtin.id) ?? {}) })), ...parsed.filter((item) => !item.builtin)]);
        }
        if (savedHistory) setHistory(savedHistory.map((item) => ({ ...item, isPracticed: item.isPracticed ?? false })));
        if (savedDraft) setDraft({ ...blankDraft(), ...savedDraft });
        setApiKey(savedKey);
        setKeyDraft(savedKey);
      } catch {
        window.setTimeout(() => showToast('Не удалось прочитать часть данных браузера. Проверьте доступное место для хранения.', 'error'), 0);
      }
      setHydrated(true);
      setOnline(navigator.onLine);
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setInstallInstructions('В Safari нажмите «Поделиться», затем выберите «На экран Домой». Для опубликованного сайта нужен HTTPS; localhost подходит для разработки.');
      else if (/android/i.test(navigator.userAgent)) setInstallInstructions('В меню Chrome выберите «Установить приложение» или «Добавить на главный экран». Для опубликованного сайта нужен HTTPS; localhost подходит для разработки.');
      else setInstallInstructions('В меню браузера выберите «Установить приложение» или «Добавить на главный экран». Для опубликованного сайта нужен HTTPS; localhost подходит для разработки.');
    };
    const hydrationTimer = window.setTimeout(() => { void hydrate(); }, 0);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeinstallprompt', onInstall);
    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', onInstall);
    };
    // Hydrate browser-only data once; persistence is handled below.
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Mask the provider base URL at rest; the in-memory `settings` keeps the
    // plaintext value used synchronously throughout the app.
    const persist = async () => {
      try {
        const storedSettings = { ...settings, baseUrl: await maskSecret(settings.baseUrl) };
        writeJson(STORAGE_KEYS.settings, storedSettings);
        writeJson(STORAGE_KEYS.prompts, prompts);
        writeJson(STORAGE_KEYS.history, history);
        writeJson(STORAGE_KEYS.draft, draft);
      } catch {
        window.setTimeout(() => showToast('Браузер не смог сохранить изменения. Освободите место в хранилище.', 'error'), 0);
      }
    };
    void persist();
  }, [hydrated, settings, prompts, history, draft]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedHistory(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!selectedHistory) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = historyModalRef.current;
    modal?.querySelector<HTMLElement>('.modal-close')?.focus();
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modal) return;
      const focusable = Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex=\'-1\'])'));
      if (!focusable.length) {
        event.preventDefault();
        modal.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trapFocus);
    return () => {
      document.removeEventListener('keydown', trapFocus);
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [selectedHistory]);

  const missing = useMemo(() => {
    const needs = [];
    if (isDraftWords(draft)) {
      if (!draft.words.some((word) => word.trim())) needs.push('задание');
    } else if (isDraftPasteBlank(draft)) {
      const hasBlank = draft.blankTask.some((segment) => segment.type === 'blank');
      const hasText = draft.blankTask.some((segment) => segment.type === 'text' && segment.text.trim());
      const hasVariant = draft.blankTask.some((segment) => segment.type === 'blank' && segment.variants.some((variant) => variant.trim()));
      if (!hasBlank || (!hasText && !hasVariant)) needs.push('задание');
    } else if (isDraftTest(draft)) {
      if (!draft.testText.trim()) needs.push('вопрос теста');
      if (!draft.testVariants.some((variant) => variant.trim())) needs.push('вариант ответа');
    } else if (!draft.sentence.trim()) {
      needs.push('задание');
    }
    if (!draft.userAnswer.trim()) needs.push('ваш вариант');
    if (!draft.correctAnswer.trim()) needs.push('правильный вариант');
    if (!apiKey.trim()) needs.push('ключ API');
    if (!settings.baseUrl.trim()) needs.push('адрес сервиса');
    if (!settings.model.trim()) needs.push('модель');
    return needs;
  }, [draft, apiKey, settings.baseUrl, settings.model]);

  const changeTaskType = (taskType: TaskType) => {
    if (draft.taskType !== taskType) {
      setDraft({
        ...blankDraft(),
        taskType,
        words: isWordsTask(taskType) ? ['', ''] : [],
        blankTask: isPasteBlankTask(taskType) ? [{ type: 'text', text: '' }, { type: 'blank', variants: [] }] : [],
        testVariants: isTestTask(taskType) ? ['', ''] : []
      });
      setExplanation(null);
      setExplanationError('');
    }
  };
  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({
    ...current,
    [key]: value
  }));
  const clearDraft = () => setDraft((current) => ({
    taskType: current.taskType,
    words: isWordsTask(current.taskType) ? ['', ''] : [],
    sentence: '',
    blankTask: isPasteBlankTask(current.taskType)
      ? [{ type: 'text', text: '' }, { type: 'blank', variants: [] }]
      : [],
    testText: '',
    testVariants: isTestTask(current.taskType) ? ['', ''] : [],
    userAnswer: '',
    correctAnswer: ''
  }));
  const startNextExplanation = () => {
    setDraft(blankDraft());
    setExplanation(null);
    setExplanationError('');
  };
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((current) => ({
    ...current,
    [key]: value
  }));
  const navigateOffline = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (!online) {
      event.preventDefault();
      window.location.assign(href);
    }
  };

  const providerError = (status: number, code?: string) => {
    if (code === 'invalid_url') return 'Укажите корректный адрес сервиса, начинающийся с http:// или https://.';
    if (code === 'missing_key') return 'Введите ключ API перед проверкой подключения.';
    if (code === 'missing_model') return 'Выберите модель в настройках.';
    if (status === 401) return 'Сервис отклонил ключ. Проверьте его и попробуйте снова.';
    if (status === 404) return 'Сервис не нашёл адрес моделей или выбранную модель.';
    if (code === 'timeout') return 'Сервис не ответил вовремя. Проверьте соединение и повторите попытку.';
    if (code === 'network') return 'Не удалось связаться с сервисом. Проверьте интернет и адрес.';
    if (code === 'empty_response') return 'Модель вернула пустой ответ. Попробуйте другую модель.';
    return 'Запрос не выполнен. Проверьте адрес, ключ и настройки модели.';
  };

  const requestModels = async (mode: 'models' | 'check') => {
    const key = keyDraft.trim();
    if (!key) {
      setProviderStatus('Введите ключ API для продолжения.');
      setProviderStatusTone('error');
      showToast('Сначала введите ключ API.', 'error');
      return;
    }
    if (!validBaseUrl(settings.baseUrl)) {
      setProviderStatus(providerError(0, 'invalid_url'));
      setProviderStatusTone('error');
      return;
    }
    setSettingsBusy(mode);
    setProviderStatus(mode === 'models' ? 'Загружаем список моделей…' : 'Проверяем соединение…');
    setProviderStatusTone('info');
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey: key }),
        signal: AbortSignal.timeout(25000),
        cache: 'no-store'
      });
      const data = await response.json() as { models?: string[]; error?: string; code?: string };
      if (!response.ok) throw Object.assign(new Error(providerError(response.status, data.code)), { safeMessage: providerError(response.status, data.code) });
      const found = Array.isArray(data.models) ? data.models : [];
      setModels(found);
      if (keyDraft.trim()) {
        try {
          writeRaw(STORAGE_KEYS.apiKey, await maskSecret(key));
          setApiKey(key);
          setKeyDraft(key);
        } catch {
          setProviderStatus('Проверка пройдена, но ключ не удалось сохранить в браузере.');
          setProviderStatusTone('error');
          showToast('Ключ прошёл проверку, но сохранить его не удалось.', 'error');
          return;
        }
      }
      const checkedAt = new Intl.DateTimeFormat('ru-RU', { timeStyle: 'short' }).format(new Date());
      setProviderStatus(mode === 'models' ? `Найдено моделей: ${ found.length }. Проверено в ${ checkedAt }.` : `Соединение работает. Найдено моделей: ${ found.length }. Проверено в ${ checkedAt }.`);
      setProviderStatusTone('success');
      showToast(mode === 'models' ? `Список загружен: ${ found.length } моделей.` : 'Соединение с сервисом работает.', 'success');
    } catch (error) {
      const message = error instanceof Error && 'safeMessage' in error ? String(error.safeMessage) : error instanceof DOMException && error.name === 'TimeoutError' ? providerError(0, 'timeout') : providerError(0, 'network');
      setProviderStatus(message);
      setProviderStatusTone('error');
      showToast(message, 'error');
    } finally {
      setSettingsBusy(null);
    }
  };

  const explain = async (event: FormEvent) => {
    event.preventDefault();
    if (missing.length || requestBusy) return;
    if (!validBaseUrl(settings.baseUrl)) {
      setExplanationError(providerError(0, 'invalid_url'));
      showToast(providerError(0, 'invalid_url'), 'error');
      return;
    }
    setRequestBusy(true);
    setExplanation(null);
    setExplanationError('');
    try {
      const task = isDraftWords(draft)
        ? draft.words.map((word) => word.trim()).filter(Boolean)
        : isDraftPasteBlank(draft)
          ? draft.blankTask
          : isDraftTest(draft)
            ? { text: draft.testText.trim(), variants: draft.testVariants.map((variant) => variant.trim()).filter(Boolean) }
            : draft.sentence.trim();
      const messages = buildMessages({
        settings,
        prompts,
        taskType: draft.taskType,
        task,
        userAnswer: draft.userAnswer,
        correctAnswer: draft.correctAnswer
      });
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey, model: settings.model, messages }),
        signal: AbortSignal.timeout(65000),
        cache: 'no-store'
      });
      const data = await response.json() as { response?: string; error?: string; code?: string };
      if (!response.ok) throw Object.assign(new Error(providerError(response.status, data.code)), { safeMessage: providerError(response.status, data.code) });
      if (!data.response?.trim()) throw Object.assign(new Error(providerError(0, 'empty_response')), { safeMessage: providerError(0, 'empty_response') });
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        taskType: draft.taskType,
        task,
        userAnswer: draft.userAnswer.trim(),
        correctAnswer: draft.correctAnswer.trim(),
        response: data.response,
        model: settings.model,
        language: settings.language,
        isPracticed: false
      };
      setHistory((current) => [item, ...current]);
      setExplanation(item);
      showToast('Разбор готов и сохранён в истории.', 'success');
    } catch (error) {
      const message = error instanceof Error && 'safeMessage' in error ? String(error.safeMessage) : error instanceof DOMException && error.name === 'TimeoutError' ? providerError(0, 'timeout') : providerError(0, 'network');
      setExplanationError(message);
      showToast(message, 'error');
    } finally {
      setRequestBusy(false);
    }
  };

  const saveKey = async () => {
    try {
      if (keyDraft.trim()) {
        writeRaw(STORAGE_KEYS.apiKey, await maskSecret(keyDraft.trim()));
        setApiKey(keyDraft.trim());
        showToast('Ключ сохранён в этом браузере.', 'success');
      } else showToast('Введите ключ API перед сохранением.', 'error');
    } catch {
      showToast('Не удалось сохранить ключ в браузере.', 'error');
    }
  };
  const clearKey = () => {
    if (!window.confirm('Удалить сохранённый ключ API из этого браузера?')) return;
    try {
      removeKey(STORAGE_KEYS.apiKey);
      setApiKey('');
      setKeyDraft('');
      showToast('Ключ удалён.', 'success');
    } catch {
      showToast('Не удалось удалить ключ.', 'error');
    }
  };

  // Export the current configuration to a JSON file. Secrets (the provider base
  // URL and API key) are written in their masked form so the file never contains
  // plaintext credentials if it is shared or left on disk.
  const exportSettings = async () => {
    try {
      const payload = {
        app: 'lingva',
        schema: 'settings:v1',
        exportedAt: new Date().toISOString(),
        settings: { ...settings, baseUrl: await maskSecret(settings.baseUrl) },
        apiKey: await maskSecret(apiKey),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lingva-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast('Настройки выгружены в файл. Секреты сохранены в замаскированном виде.', 'success');
    } catch {
      showToast('Не удалось выгрузить настройки.', 'error');
    }
  };

  // Restore configuration from a previously exported file. The file carries
  // masked secrets; we unmask them into memory so the app keeps working, while
  // storage keeps them masked (baseUrl via the persist effect, apiKey below).
  const importSettings = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as { settings?: Partial<Settings>; apiKey?: string };
      if (!data || typeof data !== 'object') throw new Error('invalid');
      const incoming = data.settings ?? {};
      const maskedBaseUrl = typeof incoming.baseUrl === 'string' ? incoming.baseUrl : '';
      const plainBaseUrl = await unmaskSecret(maskedBaseUrl);
      setSettings((current) => {
        const next: Settings = { ...current };
        if ('baseUrl' in incoming) next.baseUrl = plainBaseUrl;
        if (typeof incoming.model === 'string') next.model = incoming.model;
        if (typeof incoming.language === 'string') next.language = incoming.language;
        if (typeof incoming.suffix === 'string') next.suffix = incoming.suffix;
        if (typeof incoming.systemPrompt === 'string') next.systemPrompt = incoming.systemPrompt;
        return next;
      });
      const maskedApiKey = typeof data.apiKey === 'string' ? data.apiKey : '';
      if (maskedApiKey) {
        writeRaw(STORAGE_KEYS.apiKey, maskedApiKey);
        const plainApiKey = await unmaskSecret(maskedApiKey);
        setApiKey(plainApiKey);
        setKeyDraft(plainApiKey);
      }
      showToast('Настройки импортированы. Секреты восстановлены в замаскированном виде.', 'success');
    } catch {
      showToast('Файл настроек повреждён или имеет неверный формат.', 'error');
    }
  };

  const titleByPage: Record<string, [string, string]> = {
    explain: ['Разбор', 'Задание, ваш ответ и правильный вариант — объяснение появится ниже.'],
    history: ['История', 'Сохранённые разборы остаются только в этом браузере.'],
    prompts: ['Промпты', 'Настройте правила, по которым модель разбирает ваши ошибки.'],
    instruction: ['Инструкция', 'Основное сообщение преподавателю отправляется вместе с каждым запросом.'],
    settings: ['Настройки', 'Подключите свой сервис и выберите язык объяснений.'],
  };

  return <div className="app-frame">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label="Лингва — на страницу разбора"><span
        className="brand-mark">л</span><span>ЛИНГВА</span></Link>
      <p className="sidebar-caption">ПРОСТРАНСТВО ДЛЯ УЧЁБЫ</p>
      <nav className="main-nav" aria-label="Основная навигация">
        { PAGES.map((item) => <Link key={ item.key } href={ item.href }
                                    onClick={ (event) => navigateOffline(event, item.href) }
                                    className={ `nav-link ${ page === item.key ? 'active' : '' }` }
                                    aria-current={ page === item.key ? 'page' : undefined }><span className="nav-symbol"
                                                                                                  aria-hidden="true">{ item.symbol }</span><span>{ item.title }</span>{ item.key === 'history' && history.length > 0 &&
            <span className="nav-count">{ history.length > 99 ? '99+' : history.length }</span> }</Link>) }
      </nav>
      <div className="sidebar-bottom">
        <div className={ `connection-pill ${ online ? '' : 'offline' }` }><span
          className="status-dot"/>{ online ? 'Вы в сети' : 'Нет подключения' }</div>
        <p>Ваши записи и настройки хранятся на этом устройстве.</p>
      </div>
    </aside>
    <div className="app-main">
      <header className="mobile-header"><Link className="brand" href="/"><span
        className="brand-mark">л</span><span>ЛИНГВА</span></Link><span
        className={ `mobile-online ${ online ? '' : 'offline' }` }><span
        className="status-dot"/>{ online ? 'В сети' : 'Офлайн' }</span></header>
      { !online &&
          <div className="offline-banner" role="status"><span aria-hidden="true">⌁</span><span><b>Вы не в сети.</b> Интерфейс и сохранённые записи доступны; для нового разбора нужен интернет.</span>
          </div> }
      <main className="main-content" id="main-content">
        <div className="page-heading">
          <div><p className="eyebrow">ЛИНГВА <span>/</span> { titleByPage[page][0].toLocaleUpperCase('ru-RU') }</p>
            <h1>{ titleByPage[page][0] }</h1><p className="page-lede">{ titleByPage[page][1] }</p></div>
          { page === 'history' && history.length > 0 && <button className="button button-quiet-danger" onClick={ () => {
            if (window.confirm('Удалить все сохранённые разборы? Это действие нельзя отменить.')) {
              setHistory([]);
              setSelectedHistory(null);
              showToast('История очищена.', 'success');
            }
          } }>Очистить</button> }
        </div>

        { page === 'explain' && <ExplainPage
          draft={ draft }
          online={ online }
          apiKey={ apiKey }
          model={ settings.model }
          missing={ missing }
          requestBusy={ requestBusy }
          explanation={ explanation }
          explanationError={ explanationError }
          updateDraft={ updateDraft }
          changeTaskType={ changeTaskType }
          explain={ explain }
          clearDraft={ clearDraft }
          startNextExplanation={ startNextExplanation }
        /> }


        { page === 'history' && <HistoryPage
          history={ history }
          setHistory={ setHistory }
          setSelectedHistory={ setSelectedHistory }
          showToast={ showToast }
        /> }

        { page === 'prompts' && <PromptsPage
          prompts={ prompts }
          editingPrompt={ editingPrompt }
          editingValue={ editingValue }
          promptForm={ promptForm }
          setPrompts={ setPrompts }
          setEditingPrompt={ setEditingPrompt }
          setEditingValue={ setEditingValue }
          setPromptForm={ setPromptForm }
          showToast={ showToast }
        /> }
        { page === 'instruction' && <InstructionPage
          settings={ settings }
          updateSetting={ updateSetting }
          showToast={ showToast }
        /> }
        { page === 'settings' && <SettingsPage
          settings={ settings }
          updateSetting={ updateSetting }
          apiKey={ apiKey }
          keyDraft={ keyDraft }
          keyVisible={ keyVisible }
          models={ models }
          settingsBusy={ settingsBusy }
          providerStatus={ providerStatus }
          providerStatusTone={ providerStatusTone }
          installPrompt={ installPrompt }
          installInstructions={ installInstructions }
          saveKey={ saveKey }
          clearKey={ clearKey }
          exportSettings={ exportSettings }
          importSettings={ importSettings }
          setKeyDraft={ setKeyDraft }
          setKeyVisible={ setKeyVisible }
          setInstallPrompt={ setInstallPrompt }
          requestModels={ requestModels }
        /> }
      </main>
    </div>
    <nav className="bottom-nav" aria-label="Основная навигация для телефона">{ PAGES.map((item) => <Link
      href={ item.href } onClick={ (event) => navigateOffline(event, item.href) } key={ item.key }
      className={ page === item.key ? 'active' : '' } aria-current={ page === item.key ? 'page' : undefined }><span
      aria-hidden="true">{ item.symbol }</span><small>{ item.title }</small></Link>) }</nav>
    { toast &&
        <div className={ `toast toast-${ toast.kind }` } role={ toast.kind === 'error' ? 'alert' : 'status' }><span
            className="toast-mark">{ toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i' }</span>{ toast.text }
            <button onClick={ () => setToast(null) } aria-label="Закрыть уведомление">×</button>
        </div> }
    { selectedHistory && <div className="modal-backdrop" onMouseDown={ (event) => {
      if (event.target === event.currentTarget) setSelectedHistory(null);
    } }>
        <section ref={ historyModalRef } tabIndex={ -1 } className="history-modal workspace-card" role="dialog"
                 aria-modal="true" aria-labelledby="history-modal-title">
            <div className="modal-head">
                <div><span
                    className="type-badge">{ isWordsTask(selectedHistory.taskType) ? 'СЛОВА' : isPasteBlankTask(selectedHistory.taskType) ? 'ПРОПУСКИ' : isTestTask(selectedHistory.taskType) ? 'ТЕСТ' : 'ПРЕДЛОЖЕНИЕ' }</span><h2
                    id="history-modal-title">Разбор ошибки</h2>
                    <time>{ dateLabel(selectedHistory.createdAt) }</time>
                </div>
                <button className="icon-button modal-close" onClick={ () => setSelectedHistory(null) }
                        aria-label="Закрыть">×
                </button>
            </div>
            <div className="modal-task"><span>ЗАДАНИЕ</span>
                <p>{ taskToText(selectedHistory.task) }</p>
            </div>
            <div className="result-answers">
                <div><span>ВАШ ВАРИАНТ</span><p>{ selectedHistory.userAnswer }</p></div>
                <div><span>ПРАВИЛЬНО</span><p>{ selectedHistory.correctAnswer }</p></div>
            </div>
            <div className="result-rule"/>
            <Markdown source={ selectedHistory.response }/>
            <div className="result-meta">
                <span>{ selectedHistory.model }</span><span>·</span><span>Ответ на языке: { languageLabel(selectedHistory.language) }</span>
            </div>
        </section>
    </div> }
  </div>;
}
