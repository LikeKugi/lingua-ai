<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository guide

ЛИНГВА is a Russian-language learning app that explains why an exercise answer is incorrect. Read `PRODUCT.md` for
product principles and visual direction. `TASK.md` is the authoritative behavior and technical specification; follow
it when changing the app. Keep `README.md` aligned with user-visible behavior and setup instructions.

## Product constraints

- Keep all interface copy in Russian and preserve the five destinations: Разбор, История, Промпты, Инструкция, and
  Настройки.
- Treat this as an explanation tool, not a grader or general-purpose chatbot.
- Keep settings, prompts, API keys, and history in browser storage. Send provider requests only through the server
  route handlers, and never log or persist credentials or user exercise content on the server.
- Do not add accounts, analytics, cloud sync, ads, subscriptions, or in-app purchases.
- Keep the app shell usable offline, but do not cache or claim that AI requests work offline. Be accurate about browser
  storage: it is not encrypted or native secure storage.
- Preserve accessibility, responsive behavior, and reduced-motion support described in `TASK.md`.

## Project commands

- `npm run dev` starts the local development server.
- `npm run lint` runs ESLint.
- `npm run build` builds the production app.
- `npm run start` serves a production build.

Avoid adding dependencies unless the existing stack cannot reasonably support the change.
