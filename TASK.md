# Prompt: Build Лингва as a Progressive Web App

Implement the product described in this prompt as a polished, installable Progressive Web App (PWA) using Next.js and
TypeScript. This is a self-contained specification: do not depend on another app, repository, source files, or
unavailable services for product requirements. Use Next.js server-side route handlers as the proxy for all AI provider
requests. Do not add accounts, analytics, or cloud sync.

## Product

**Лингва — AI Error Explainer** helps people studying languages understand why their answer to an exercise is wrong. A
learner enters a word-building or sentence task, their answer, and the correct answer. The app sends these details to
the learner’s chosen OpenAI-compatible provider, displays a structured explanation, and saves it in local history.

The interface is in Russian. The response language is independently selectable. Support these response languages:
Русский (`ru`), English (`en`), Deutsch (`de`), Français (`fr`), Español (`es`), Italiano (`it`), Português (`pt`), 中文
(`zh`), 日本語 (`ja`), and 한국어 (`ko`). Default to the device language when it is supported; otherwise default to
Russian.

The app uses a bring-your-own-key model. Save the API key, provider base URL, and model selection on the client device.
When needed, the client sends the key, base URL, model, and request data to the app's server API; the server makes the
request to the configured provider and returns the result. The app server must not persist these values or the request
content. The provider receives the exercise, answers, and prompts when an explanation is requested. Provider access
depends on internet connectivity; browser-to-provider CORS is not required because provider requests run on the server.

The app is free to use, with no ads, subscriptions, in-app purchases, or user accounts. Users pay their provider for any
API usage. Support OpenAI-compatible services such as OpenAI, OpenRouter, Groq, Together, DeepSeek, Mistral, and local
Ollama or LM Studio endpoints.

## Visual and interaction design

Create a calm, focused language-learning workspace. Use a warm paper background, forest-green primary actions, lime
accents, soft cards and borders, serif display headings, and restrained typography. Suggested palette: paper `#F3F1E9`,
surface `#FFFEFA`, ink `#1C3028`, muted `#777E74`, forest `#244D3B`, forest-soft `#E4EDE4`, lime `#D6E98A`, and coral
`#B85645` for errors and destructive actions.

Keep the **ЛИНГВА** brand and five obvious destinations: **Разбор**, **История**, **Промпты**, **Инструкция**, and
**Настройки**. Use a compact bottom navigation on phones and a clear sidebar or top navigation on wider screens. Keep
page widths readable on desktop and prevent horizontal overflow on small screens. Make common actions easy to find and
label; give forms helpful placeholders, preserve entered data after successful explanations, and show clear loading,
success, empty, offline, and error states.

Use motion sparingly to clarify state and navigation. Keep transitions short (about 150–250 ms) with gentle easing;
animate small changes such as opening dialogs, switching tabs, expanding details, and adding or removing prompt/history
items. Use a subtle progress indicator while requests are running, and make loading, success, and error feedback appear
without waiting for decorative animation to finish. Avoid parallax, looping decoration, large entrance effects, and
motion that delays interaction. Respect `prefers-reduced-motion` by removing nonessential movement and replacing spatial
transitions with immediate state changes or simple fades. Do not rely on animation alone to communicate status.

Support keyboard navigation, visible focus, semantic labels, screen readers, contrast, touch-sized controls, virtual
keyboards, safe areas, and reduced motion. Confirm destructive actions. Dialogs and pickers must work with mouse,
keyboard, and touch.

## Pages and behavior

### Разбор (Explain)

- Offer three task types: **Слова** (make a sentence from a set of words), **Предложение** (translate or transform a
  source sentence), and **Пропуски** (paste a sentence with blanks). Start in word mode with two empty word inputs.
- In word mode, allow users to add inputs and remove any input while always keeping at least one. Ignore blank word
  inputs when building the request. Word mode also has an optional task-description input («Описание задания»); when
  filled, it is saved with the task and sent with the request. In sentence mode, use one multiline source-sentence
  input. In **Пропуски** mode, let users build the sentence from alternating text and blank segments; each blank may
  carry optional variant words for insertion. A blank task is valid only when it has at least one blank and some text
  or at least one variant. Switching task type clears the task and both answer fields.
- Include multiline fields for **Ваш вариант** and **Правильный вариант**. Switching task type clears the task and both
  answer fields.
- Disable **Разобрать ошибку** until the task, learner answer, correct answer, API key, base URL, and model are present.
  Explain what is missing and provide a direct way to open Settings.
- On submit, show a loading state, then render the provider’s Markdown response. Keep the form contents after success.
  Show API failures inline and in an accessible notification.
- Save each successful explanation to History with the task, both answers, response, model, selected response language,
  unique ID, and creation timestamp.

### История (History)

- Show successful explanations newest first. Each card includes the task type, date, task preview, learner answer, and
  response preview.
- Format dates in Russian (`ru-RU`), including dates shown in the detail view.
- Opening a card shows the full task, learner answer, correct answer, and Markdown explanation. Include the model,
  response language, and date in the saved record; display useful metadata in the detail view.
- Allow an individual record to be deleted and provide **Очистить** to delete all records after confirmation. Include a
  friendly empty state before the first explanation.

### Промпты (Prompts)

- Start with four enabled built-in prompt templates: **Грамматика**, **Синтаксис**, **Лексика**, and **Примеры**. Users
  can toggle and edit built-in prompts but cannot delete them.
- Allow users to add, edit, enable/disable, and delete custom prompts. New prompts are enabled by default. Require a
  non-empty title and instruction; confirm deletion.
- Include each enabled prompt as `title: body` in the system message for future explanations.

### Инструкция (System Prompt)

- Provide a multiline editor for the base system prompt, a character count, and an indication that edits save
  automatically.
- Include **Сбросить к стандартной**. It restores the default base instruction below without changing the prompt suffix
  or prompt templates.

Default base system prompt:

```text
Ты — опытный преподаватель иностранных языков.
Твоя задача — объяснять учащемуся его ошибки.
Ты должен:
- разобрать грамматику (почему форма слова неверна),
- разобрать синтаксис (почему порядок/структура неверны),
- разобрать лексику (почему слово не подходит по смыслу),
- предложить корректный вариант и кратко пояснить правило.
Отвечай дружелюбно, структурировано, без воды.
```

### Настройки (Settings)

- Include an API key field, base URL, model picker, **Загрузить модели**, **Проверить подключение**, response-language
  picker, and multiline prompt-suffix field. Store the key, URL, selected model, and other settings on the client.
- Default the base URL to `https://api.openai.com/v1`. Validate that it is an HTTP or HTTPS URL before making a request.
  Mask the API key by default, indicate whether it is saved, let the user replace or clear it, and provide an explicit
  **Сохранить ключ** action.
- **Загрузить модели** sends the base URL and API key to the app's server model route. The server calls
  `GET {baseUrl}/models` with `Authorization: Bearer {apiKey}` and returns the result. Send credentials in a POST body,
  never in a URL. Read model IDs, sort them by name, and show them in a picker. Keep the currently selected model
  available if it is missing from the latest model response. Show loading and success/error results, including how many
  models were found. Do not select a model without the user’s choice.
- **Проверить подключение** asks the app's server to check the same models endpoint and shows the result and check time.
  If the user’s unsaved key draft passes a model load or connection check, save it automatically; show an error if
  saving fails.
- Persist base URL, model, suffix, response language, and system prompt automatically. The suffix is appended to the
  system prompt for each request.
- Explain the web storage limitation next to the key controls: browsers do not provide native secure storage, so the key
  is stored in this browser’s `localStorage` if the user saves it. Do not call browser storage secure. Send the key only
  to the app's server API when making a provider request or checking/loading models, and from there only to the
  configured provider in the authorization header. Never log or persist the key on the app server.

## Prompt defaults and request format

The four built-in prompts are:

| Title      | Instruction                                                                              |
|------------|------------------------------------------------------------------------------------------|
| Грамматика | Обрати особое внимание на грамматические ошибки: времена, согласование, падежи, артикли. |
| Синтаксис  | Проверь порядок слов, структуру предложения, согласование подлежащего и сказуемого.      |
| Лексика    | Проверь уместность выбранных слов, коллокации, идиоматичность.                           |
| Примеры    | Приведи 2–3 примера корректного употребления правила.                                    |

Build two chat messages for each explanation:

1. **System message:** the trimmed base system prompt, followed by each enabled prompt as `title: body`, the trimmed
   optional suffix, and `Ответ дай структурировано и на языке: {response language label}.` Separate non-empty sections
   with blank lines.
2. **User message:** for word tasks use `Задание: составить предложение из слов: [word1, word2, ...]`, followed by
   `Описание задания: {task description}` when the optional word-task description is filled; for sentence
   tasks use `Задание: исходное предложение — «{sentence}»`. Then include `Мой вариант: «{learner answer}»`,
   `Правильный вариант: «{correct answer}»`, a blank line, and
   `Объясни, в чём именно я ошибся: разбери грамматику, синтаксис и лексику.` Finish with
   `Ответ дай структурировано и на языке: {response language label}.`

The client sends the selected model, base URL, API key, and chat messages in a POST body to the app's `/api/explain`
route. For model loading and connection checks, send the base URL and API key in a POST body to `/api/models`. The
server sends a non-streaming request to `{baseUrl}/chat/completions` with JSON content type and a Bearer authorization
header. The provider request body is `{ model, messages, temperature: 0.3, stream: false }`. The server reads the
assistant response from the first choice’s message content and returns it to the client, where it is rendered as
Markdown. Keep provider requests in server-side route handlers rather than UI components. Do not log credentials,
prompts, user tasks, answers, or provider responses on the server.

Show useful, distinct errors for a rejected API key (HTTP 401), missing model or URL (HTTP 404), invalid URL, missing
key, other HTTP errors, network failure, timeout, and an empty provider response. Do not expose raw credentials in logs
or error messages.

## Local data

Persist settings, prompts, and history in browser-local storage and keep them available after reloads and PWA restarts.
Use versioned keys `settings:v1`, `prompts:v1`, and `history:v1`; store the API key separately under `apiKey`. Settings
and the API key stay client-side at rest. Send only the current request's required configuration and content to the app
server, which uses them for the provider request without storing them. Do not upload or sync history or unrelated saved
settings. Never put private request data in service-worker caches.

Use these data shapes:

```ts
type TaskType = 'words' | 'sentence' | 'paste-blank' | 'test';

type BlankSegment =
  | { type: 'text'; text: string }
  | { type: 'blank'; variants: string[] };

type TestTask = {
  text: string;
  variants: string[];
};

type WordsTask = {
  words: string[];
  description?: string;
};

type HistoryItem = {
  id: string;
  createdAt: number;
  taskType: TaskType;
  task: string | string[] | BlankSegment[] | WordsTask | TestTask;
  userAnswer: string;
  correctAnswer: string;
  response: string;
  model: string;
  language: string;
  isPracticed: boolean;
};

type PromptTemplate = {
  id: string;
  title: string;
  body: string;
  enabled: boolean;
  builtin: boolean;
};
```

## PWA requirements

- Provide a valid web manifest for **Лингва** with a short name, standalone display, start URL and scope, paper
  background, forest theme color, and working 192×192 and 512×512 icons. Include a maskable icon when supported.
- Register a versioned service worker. Cache the application shell and static assets so the app can reopen its interface
  offline after it has loaded once. Add a visible, accessible offline status and explain that generating a new AI
  response requires internet access.
- Never cache AI-related requests or responses. Do not cache, intercept, or replay requests to the app's model or
  explanation API routes, provider `/models` or `/chat/completions` requests, authorization headers, API keys, user tasks,
  answers, prompts, or explanations. The browser calls the app's server routes; those routes call the configured
  provider.
- Support installation where the browser allows it. Show a real install action only when an install prompt is available;
  otherwise provide concise platform-appropriate installation instructions. Make installation optional and keep the
  website fully usable without it.
- Make every page work when opened directly or refreshed. Document that production installation requires HTTPS;
  localhost is suitable during development.

## Implementation and completion

Use Next.js and TypeScript with accessible HTML and a lightweight styling approach. Keep provider integrations in
server-side route handlers, with the client responsible for local settings and data. Avoid unnecessary dependencies.
Keep product behavior and UI state clear, persist edits predictably, and handle storage errors gracefully. Do not claim
browser storage is encrypted or that AI features work offline.

The work is complete when all five pages behave as specified; explanation requests produce and display a Markdown answer
and save it to history; settings, system prompt, prompt templates, and history persist locally; model loading and
connection checks show meaningful feedback; built-in and custom prompt rules work; the app is installable with working
icons; and the cached interface reopens offline without caching private or provider data. Verify the production web
build and exercise the key flows in a browser. Report what was implemented, the checks performed, and any hosting or
browser limitations.
