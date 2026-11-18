'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FormEvent,
  MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  defaultLanguage, defaultSettings, dateLabel,
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
import PracticePage from './components/PracticePage';
import {
  createI18n, defaultPrompts, I18nProvider, isInterfaceLanguage, localizePrompts, localizeSystemPrompt, taskTypeName,
} from './i18n';

const blankDraft = (): Draft => ({ taskType: 'sentence', words: [], wordsDescription: '', sentence: '', blankTask: [], testText: '', testVariants: [], userAnswer: '', correctAnswer: '' });
const PAGES = [
  { href: '/', key: 'explain', symbol: '✳' },
  { href: '/history', key: 'history', symbol: '◷' },
  { href: '/prompts', key: 'prompts', symbol: '☷' },
  { href: '/instruction', key: 'instruction', symbol: '≡' },
  { href: '/settings', key: 'settings', symbol: '⚙' },
] as const;

type InstallKind = 'generic' | 'ios' | 'android';

export default function Workspace() {
  const pathname = usePathname();
  const router = useRouter();
  const page = pathname === '/practice' ? 'practice' : PAGES.find((entry) => entry.href === pathname)?.key ?? 'explain';
  const [settings, setSettings] = useState<Settings>(() => defaultSettings(createI18n('ru').t.defaults.systemPrompt));
  const [prompts, setPrompts] = useState<PromptTemplate[]>(() => defaultPrompts('ru'));
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
  const [practiceItemId, setPracticeItemId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [installKind, setInstallKind] = useState<InstallKind>('generic');
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [promptForm, setPromptForm] = useState({ title: '', body: '' });
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState({ title: '', body: '' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyModalRef = useRef<HTMLElement | null>(null);

  const i18n = useMemo(() => createI18n(settings.uiLanguage), [settings.uiLanguage]);
  const { t, locale } = i18n;
  // Built-in prompts and an untouched default instruction are shown and sent in the interface language.
  const shownSettings = useMemo(
    () => ({ ...settings, systemPrompt: localizeSystemPrompt(settings.systemPrompt, i18n.language) }),
    [settings, i18n.language],
  );
  const shownPrompts = useMemo(() => localizePrompts(prompts, i18n.language), [prompts, i18n.language]);
  // Effects that run once or do not list the dictionary as a dependency read the latest one through this ref.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const showToast = (text: string, kind: Toast['kind'] = 'info') => {
    setToast({ text, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  };

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

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
        // Users who saved settings before the interface picker existed keep the Russian UI;
        // first-time visitors get the device language when it is supported.
        const uiLanguage = isInterfaceLanguage(parsedSettings.uiLanguage)
          ? parsedSettings.uiLanguage
          : savedSettings ? 'ru' : defaultLanguage();
        setSettings({
          ...defaultSettings(createI18n(uiLanguage).t.defaults.systemPrompt), ...parsedSettings,
          baseUrl: restoredBaseUrl,
          language: parsedSettings.language ?? defaultLanguage(),
          uiLanguage,
        });
        if (savedPrompts) {
          const parsed = savedPrompts;
          setPrompts([...defaultPrompts(uiLanguage).map((builtin) => ({ ...builtin, ...(parsed.find((item) => item.id === builtin.id) ?? {}) })), ...parsed.filter((item) => !item.builtin)]);
        }
        if (savedHistory) setHistory(savedHistory.map((item) => ({ ...item, isPracticed: item.isPracticed ?? false })));
        if (savedDraft) setDraft({ ...blankDraft(), ...savedDraft });
        setApiKey(savedKey);
        setKeyDraft(savedKey);
      } catch {
        window.setTimeout(() => showToast(tRef.current.app.hydrateError, 'error'), 0);
      }
      setHydrated(true);
      setOnline(navigator.onLine);
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setInstallKind('ios');
      else if (/android/i.test(navigator.userAgent)) setInstallKind('android');
      else setInstallKind('generic');
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
        window.setTimeout(() => showToast(tRef.current.app.storageError, 'error'), 0);
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
    const needs: string[] = [];
    const items = t.explain.missingItems;
    if (isDraftWords(draft)) {
      if (!draft.words.some((word) => word.trim())) needs.push(items.task);
    } else if (isDraftPasteBlank(draft)) {
      const hasBlank = draft.blankTask.some((segment) => segment.type === 'blank');
      const hasText = draft.blankTask.some((segment) => segment.type === 'text' && segment.text.trim());
      const hasVariant = draft.blankTask.some((segment) => segment.type === 'blank' && segment.variants.some((variant) => variant.trim()));
      if (!hasBlank || (!hasText && !hasVariant)) needs.push(items.task);
    } else if (isDraftTest(draft)) {
      if (!draft.testText.trim()) needs.push(items.testQuestion);
      if (!draft.testVariants.some((variant) => variant.trim())) needs.push(items.testVariant);
    } else if (!draft.sentence.trim()) {
      needs.push(items.task);
    }
    if (!draft.userAnswer.trim()) needs.push(items.yourAnswer);
    if (!draft.correctAnswer.trim()) needs.push(items.correctAnswer);
    if (!apiKey.trim()) needs.push(items.apiKey);
    if (!settings.baseUrl.trim()) needs.push(items.baseUrl);
    if (!settings.model.trim()) needs.push(items.model);
    return needs;
  }, [draft, apiKey, settings.baseUrl, settings.model, t]);

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
    wordsDescription: '',
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
  const startPractice = (id: string) => {
    setPracticeItemId(id);
    router.push('/practice');
  };

  const providerError = (status: number, code?: string) => {
    if (code === 'invalid_url') return t.errors.invalidUrl;
    if (code === 'missing_key') return t.errors.missingKeyCheck;
    if (code === 'missing_model') return t.errors.missingModel;
    if (status === 401) return t.errors.unauthorized;
    if (status === 404) return t.errors.notFound;
    if (code === 'timeout') return t.errors.timeout;
    if (code === 'network') return t.errors.network;
    if (code === 'empty_response') return t.errors.emptyResponse;
    return t.errors.generic;
  };

  const requestModels = async (mode: 'models' | 'check') => {
    const key = keyDraft.trim();
    if (!key) {
      setProviderStatus(t.settings.enterKeyForModels);
      setProviderStatusTone('error');
      showToast(t.settings.enterKeyFirst, 'error');
      return;
    }
    if (!validBaseUrl(settings.baseUrl)) {
      setProviderStatus(providerError(0, 'invalid_url'));
      setProviderStatusTone('error');
      return;
    }
    setSettingsBusy(mode);
    setProviderStatus(mode === 'models' ? t.settings.loadingModelsStatus : t.settings.checkingConnectionStatus);
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
          setProviderStatus(t.settings.keyPassedSaveFailed);
          setProviderStatusTone('error');
          showToast(t.settings.keyPassedSaveFailedToast, 'error');
          return;
        }
      }
      const checkedAt = new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date());
      setProviderStatus(mode === 'models' ? t.settings.modelsFound(found.length, checkedAt) : t.settings.connectionOk(found.length, checkedAt));
      setProviderStatusTone('success');
      showToast(mode === 'models' ? t.settings.modelsLoadedToast(found.length) : t.settings.connectionWorksToast, 'success');
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
      const words = draft.words.map((word) => word.trim()).filter(Boolean);
      const wordsDescription = draft.wordsDescription.trim();
      const task = isDraftWords(draft)
        ? wordsDescription ? { words, description: wordsDescription } : { words }
        : isDraftPasteBlank(draft)
          ? draft.blankTask
          : isDraftTest(draft)
            ? { text: draft.testText.trim(), variants: draft.testVariants.map((variant) => variant.trim()).filter(Boolean) }
            : draft.sentence.trim();
      const messages = buildMessages({
        settings: shownSettings,
        prompts: shownPrompts,
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
      showToast(t.explain.explainedToast, 'success');
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
        showToast(t.settings.keySaved, 'success');
      } else showToast(t.settings.keyEnterFirst, 'error');
    } catch {
      showToast(t.settings.keySaveFailed, 'error');
    }
  };
  const clearKey = () => {
    if (!window.confirm(t.settings.keyConfirmDelete)) return;
    try {
      removeKey(STORAGE_KEYS.apiKey);
      setApiKey('');
      setKeyDraft('');
      showToast(t.settings.keyDeleted, 'success');
    } catch {
      showToast(t.settings.keyDeleteFailed, 'error');
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
      showToast(t.settings.exportDone, 'success');
    } catch {
      showToast(t.settings.exportFailed, 'error');
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
        if (isInterfaceLanguage(incoming.uiLanguage)) next.uiLanguage = incoming.uiLanguage;
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
      showToast(t.settings.importDone, 'success');
    } catch {
      showToast(t.settings.importFailed, 'error');
    }
  };

  return <I18nProvider value={ i18n }>
  <div className="app-frame">
    <aside className="sidebar">
      <Link className="brand" href="/" aria-label={ t.app.brandLinkLabel }><span
        className="brand-mark">л</span><span>{ t.app.brand }</span></Link>
      <p className="sidebar-caption">{ t.app.brandCaption }</p>
      <nav className="main-nav" aria-label={ t.app.mainNav }>
        { PAGES.map((item) => <Link key={ item.key } href={ item.href }
                                    onClick={ (event) => navigateOffline(event, item.href) }
                                    className={ `nav-link ${ page === item.key ? 'active' : '' }` }
                                    aria-current={ page === item.key ? 'page' : undefined }><span className="nav-symbol"
                                                                                                  aria-hidden="true">{ item.symbol }</span><span>{ t.nav[item.key] }</span>{ item.key === 'history' && history.length > 0 &&
            <span className="nav-count">{ history.length > 99 ? '99+' : history.length }</span> }</Link>) }
      </nav>
      <div className="sidebar-bottom">
        <div className={ `connection-pill ${ online ? '' : 'offline' }` }><span
          className="status-dot"/>{ online ? t.app.online : t.app.offline }</div>
        <p>{ t.app.sidebarNote }</p>
      </div>
    </aside>
    <div className="app-main">
      <header className="mobile-header"><Link className="brand" href="/"><span
        className="brand-mark">л</span><span>{ t.app.brand }</span></Link><span
        className={ `mobile-online ${ online ? '' : 'offline' }` }><span
        className="status-dot"/>{ online ? t.app.mobileOnline : t.app.mobileOffline }</span></header>
      { !online &&
          <div className="offline-banner" role="status"><span aria-hidden="true">⌁</span><span><b>{ t.app.offlineTitle }</b> { t.app.offlineText }</span>
          </div> }
      <main className="main-content" id="main-content">
        <div className="page-heading">
          <div><p className="eyebrow">{ t.app.brand } <span>/</span> { t.nav[page].toLocaleUpperCase(locale) }</p>
            <h1>{ t.nav[page] }</h1><p className="page-lede">{ t.lede[page] }</p></div>
          { page === 'history' && history.length > 0 && <button className="button button-quiet-danger" onClick={ () => {
            if (window.confirm(t.app.confirmClearHistory)) {
              setHistory([]);
              setSelectedHistory(null);
              showToast(t.app.historyCleared, 'success');
            }
          } }>{ t.app.clearHistory }</button> }
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
          onPracticeItem={ startPractice }
          showToast={ showToast }
        /> }

        { page === 'prompts' && <PromptsPage
          prompts={ shownPrompts }
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
          settings={ shownSettings }
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
          installInstructions={ t.install[installKind] }
          saveKey={ saveKey }
          clearKey={ clearKey }
          exportSettings={ exportSettings }
          importSettings={ importSettings }
          setKeyDraft={ setKeyDraft }
          setKeyVisible={ setKeyVisible }
          setInstallPrompt={ setInstallPrompt }
          requestModels={ requestModels }
        /> }
        { page === 'practice' && <PracticePage
          initialItemId={ practiceItemId }
          history={ history }
          setHistory={ setHistory }
          settings={ settings }
          apiKey={ apiKey }
          online={ online }
          showToast={ showToast }
        /> }
      </main>
    </div>
    <nav className="bottom-nav" aria-label={ t.app.bottomNav }>{ PAGES.map((item) => <Link
      href={ item.href } onClick={ (event) => navigateOffline(event, item.href) } key={ item.key }
      className={ page === item.key ? 'active' : '' } aria-current={ page === item.key ? 'page' : undefined }><span
      aria-hidden="true">{ item.symbol }</span><small>{ t.nav[item.key] }</small></Link>) }</nav>
    { toast &&
        <div className={ `toast toast-${ toast.kind }` } role={ toast.kind === 'error' ? 'alert' : 'status' }><span
            className="toast-mark">{ toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i' }</span>{ toast.text }
            <button onClick={ () => setToast(null) } aria-label={ t.app.closeToast }>×</button>
        </div> }
    { selectedHistory && <div className="modal-backdrop" onMouseDown={ (event) => {
      if (event.target === event.currentTarget) setSelectedHistory(null);
    } }>
        <section ref={ historyModalRef } tabIndex={ -1 } className="history-modal workspace-card" role="dialog"
                 aria-modal="true" aria-labelledby="history-modal-title">
            <div className="modal-head">
                <div><span
                    className="type-badge">{ taskTypeName(t, selectedHistory.taskType).toLocaleUpperCase(locale) }</span><h2
                    id="history-modal-title">{ t.app.historyModalTitle }</h2>
                    <time>{ dateLabel(selectedHistory.createdAt, locale) }</time>
                </div>
                <button className="icon-button modal-close" onClick={ () => setSelectedHistory(null) }
                        aria-label={ t.common.close }>×
                </button>
            </div>
            <div className="modal-task"><span>{ t.labels.task }</span>
                <p>{ taskToText(selectedHistory.task) }</p>
            </div>
            <div className="result-answers">
                <div><span>{ t.labels.yourAnswer }</span><p>{ selectedHistory.userAnswer }</p></div>
                <div><span>{ t.labels.correct }</span><p>{ selectedHistory.correctAnswer }</p></div>
            </div>
            <div className="result-rule"/>
            <Markdown source={ selectedHistory.response }/>
            <div className="result-meta">
                <span>{ selectedHistory.model }</span><span>·</span><span>{ t.common.answerInLanguage(languageLabel(selectedHistory.language)) }</span>
            </div>
        </section>
    </div> }
  </div>
  </I18nProvider>;
}
