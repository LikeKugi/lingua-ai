# ЛИНГВА

ЛИНГВА helps language learners understand why an answer was wrong. Enter the exercise, your answer, and the correct answer to get a clear breakdown of the mistake, a corrected form, and examples of the rule in use.

The app is designed to explain mistakes, rather than grade work or act as a general-purpose chatbot. It supports word-building exercises and sentence translation or transformation. Explanations can be requested in ten languages, and successful results are saved in your history for later review.

## Why use ЛИНГВА

- **Learn the rule behind the correction.** Explanations can break a mistake down by grammar, syntax, and vocabulary, with examples to help you apply the rule next time.
- **Choose the AI provider and model.** Connect any OpenAI-compatible API, including a local endpoint such as Ollama or LM Studio. The app does not lock you into a specific model.
- **Keep your learning data in your browser.** Settings, prompts, history, and the API key are stored locally; there are no accounts or cloud sync. Only the current explanation or model-check request is sent through the app server to your configured provider.
- **Make explanations your own.** Edit the system instruction, enable or adjust built-in prompt rules, and add custom ones.
- **Use it across devices and revisit work.** The responsive web app can be installed as a PWA. Its interface can reopen offline after loading, while AI requests need an internet connection.
- **No app subscription.** ЛИНГВА has no ads, accounts, or in-app purchases. Your AI provider may charge for its API usage under its own terms.

## Technology

- [Next.js 16](https://nextjs.org/) App Router and server route handlers
- [React 19](https://react.dev/) with [TypeScript 5](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- Browser `localStorage` for settings, prompts, API key, and explanation history
- A web manifest and service worker for installable PWA support
- OpenAI-compatible provider APIs for model discovery and explanations

Provider requests go through the app’s `/api/models` and `/api/explain` server routes. The app does not store provider data on its server. The API key is stored in this browser’s `localStorage`, which browsers do not protect with native secure storage; use a device you trust. The AI provider receives the content needed to generate each explanation.

## Run locally

You’ll need Node.js and an API key for an OpenAI-compatible provider.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In **Настройки**, enter your provider’s base URL and API key, load the available models, and select one. Then go to **Разбор**, provide an exercise, your answer, and the correct answer, and request an explanation.

Available commands:

```bash
npm run dev      # Start the development server
npm run build    # Build the production app
npm run start    # Serve the production build
npm run lint     # Run ESLint
```

## Main sections

- **Разбор** — submit a word or sentence exercise and receive an explanation.
- **История** — revisit or delete saved explanations.
- **Промпты** — manage built-in and custom explanation rules.
- **Инструкция** — edit the base system instruction.
- **Настройки** — configure the provider, model, response language, and optional prompt suffix.
