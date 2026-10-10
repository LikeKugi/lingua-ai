# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Any language learner who has just finished an exercise and discovered that their answer was wrong. The owner
explicitly refused to narrow this down: no age, level, language studied, or setting defines the user, and no persona
should ever be invented for them. They arrive holding three things already — the task, the answer they gave, and the
correct answer — and they want to know why the gap exists.

Teachers and tutors are a real second audience, not an afterthought: they open the same form to produce an
explanation of a specific student's mistake to hand back. No teacher-specific mode exists or was requested.

The learner's own language of study is unconstrained by the product; nothing in it is built for one target language.
The interface speaks Russian, and the explanation may come back in any of ten supported languages.

Sessions happen on a laptop, a tablet, or a phone — all three are first-class, none is the fallback. Sessions are
short and easily interrupted.

## Product Purpose

Turn a wrong answer into a rule the learner can carry to the next exercise. Лингва takes a task, the learner's
answer, and the correct answer, and asks a model to break the mistake down by grammar, by syntax, and by lexicon,
then hand back the corrected form and two or three examples of the rule in use.

Success is not "the learner got the right answer." Success is that the learner understands why the answer they
produced was wrong, so the mistake stops repeating. Every surface exists to serve that one outcome.

## Positioning

Лингва is not a chatbot and not a grader. It is a structured explanation generator with a fixed request shape: a
teacher persona the learner owns and can edit, a set of prompt rules the learner toggles, an optional suffix, and an
explicitly requested response language. The learner sees and controls every part of what gets sent.

Three things together are the mechanism a neighbouring product could not truthfully copy:

1. **Their provider, their model.** Any OpenAI-compatible endpoint — OpenAI, OpenRouter, Groq, Together, DeepSeek,
   Mistral, or a local Ollama / LM Studio instance — configured by the learner. The product never ships a model of
   its own and never locks one in.
2. **Nothing leaves the device except one request.** History, prompts, settings, and the key stay in browser storage.
   A single explanation sends one request through the app's own server to the learner's provider. No accounts, no
   sync, no analytics, no ads, no purchases — free, permanently.
3. **It explains, it does not score.** Grading tools mark answers right or wrong. Лингва assumes wrongness is already
   known and spends all of its effort on the reason.

## Operating Context

Factual conditions of use that future work must design around:

- Always used beside something else — a textbook, an exercise app, homework, classwork, or another person's work. The
  three inputs are transcribed by hand into the form. It is a companion to whatever the learner is already doing.
- Generating an explanation requires internet and a reachable, funded provider. Either can fail at any time, so each
  request needs a distinguishable failure: rejected key, missing model or URL, malformed URL, missing key, HTTP
  error, network failure, timeout, empty provider response.
- The learner configures their own provider, so most people meet the app in an unconfigured state. It must say
  plainly what is missing and offer a direct way to supply it.
- Sessions get interrupted. Entered data survives a successful explanation and must survive reloads and PWA restarts.
- Installed as a PWA on phones and tablets; the interface reopens offline, the AI features do not.
- The UI is Russian throughout, including `ru-RU` dates and every helper, empty-state, offline, and error message.

## Capabilities and Constraints

**Capabilities.** Five destinations: Разбор, История, Промпты, Инструкция, Настройки. Two task types: Слова (build a
sentence from a set of words) and Предложение (translate or transform a source sentence). Markdown rendering of the
answer. Load a provider's model list and check the connection. Ten response languages — Русский, English, Deutsch,
Français, Español, Italiano, Português, 中文, 日本語, 한국어 — defaulting to the device language when supported and to
Russian otherwise. Editable base system prompt with restore-to-standard. Four built-in prompt rules (Грамматика,
Синтаксис, Лексика, Примеры) that can be toggled and edited but never deleted, plus custom rules the learner fully
controls. Local history cards with a detail view, per-record delete, and a confirmed clear-all.

**Storage.** Versioned `settings:v1`, `prompts:v1`, `history:v1`, and `apiKey`. Persisted client-side at rest and
surviving reloads and PWA restarts.

**Hard technical constraints.**

- Provider traffic travels only through the app's own server route handlers (`/api/explain`, `/api/models`). The
  client never talks to a provider directly.
- Credentials travel in POST bodies, never in a URL or query string. The server must not log or persist the key, the
  base URL, tasks, answers, prompts, or provider responses.
- Base URL validates as HTTP or HTTPS before any request; it defaults to `https://api.openai.com/v1`.
- The service worker caches the app shell and static assets and nothing else. Never cache or replay explanation or
  model requests, provider responses, authorization headers, keys, tasks, answers, prompts, or explanations.
- No model is ever selected on the learner's behalf. A model missing from a fresh model list stays available; a key
  draft is saved automatically only once it passes a model load or connection check.
- Free, no ads, no subscriptions, no in-app purchases, no accounts, no analytics, no cloud sync. The learner pays
  their own provider.

**Honesty constraints.** Never describe browser storage as secure or encrypted — say plainly that the browser offers
no native secure storage and that the key lives in this browser's `localStorage`. Never claim the AI features work
offline. Never log or surface raw credentials in errors or logs.

**Confirmed absence.** No accounts, roles, payments, quotas, server-side persistence, sharing, or export target
exists or was requested. There is no picker for the language being studied. Do not design around any of these.

## Brand Commitments

- **Name:** Лингва, set in caps as **ЛИНГВА**, positioned as an AI error explainer. Fixed.
- **UI language is Russian.** Every label, placeholder, helper, empty state, offline notice, error, confirmation, and
  date is Russian. No English string belongs in the interface.
- **Voice:** friendly, structured, no filler. This governs the product's own copy and is also demanded of the
  explanation the model returns. Direct address, concrete about the mistake.
- **No existing identity.** No logo, no icon, no chosen or licensed font, no brandbook — all of it is to be authored.
  Future work creates these freely and must not assume a pre-existing asset or a typeface it has to match.
- **Binding visual direction already decided by the owner**, recorded here because it arrived as a directive rather
  than an open question: calm focused workspace, warm paper background, forest-green primary actions, lime accents,
  soft cards and borders, serif display headings, restrained typography. Palette paper `#F3F1E9`, surface `#FFFEFA`,
  ink `#1C3028`, muted `#777E74`, forest `#244D3B`, forest-soft `#E4EDE4`, lime `#D6E98A`, coral `#B85645` for errors
  and destructive actions. Motion stays about 150–250 ms with gentle easing, honours `prefers-reduced-motion`, never
  delays feedback, and is never the only channel for status. Changing any of this is the owner's call.
- **Fixed destination names:** Разбор, История, Промпты, Инструкция, Настройки — five, always these five.

## Evidence on Hand

- `TASK.md` — the complete behavioral and technical specification, written by the owner and authoritative for
  anything it states. No other product document exists.
- Nothing else. There are **no** users, usage numbers, ratings, testimonials, reviews, case studies, press, demo
  recordings, or performance benchmarks. There is no logo, icon, font, or brandbook file.
- The SVGs in `public/` (next.svg, vercel.svg, file.svg, globe.svg, window.svg) are `create-next-app` placeholders
  and are not assets of this product.
- **No social proof may ever be invented.** No user counts, no "trusted by", no quotes, no ratings on any surface
  until something real exists and is recorded here first.

## Product Principles

1. **Explain the mistake, never just the answer.** Every surface either produces that breakdown, retrieves it later,
   or tunes how it is produced. Anything else does not belong in the product.
2. **Nothing private leaves the device by default.** Local history, local settings, local key, one request per
   explanation to the learner's own provider. Accounts, sync, or telemetry break the product.
3. **The learner owns the intelligence.** Any OpenAI-compatible provider, any model, local endpoints included, every
   prompt editable. Never take the cleverness out of their hands.
4. **Calm, legible, interruptible.** No vying for attention, no motion that delays feedback, no decoration costing
   time the learner did not mean to spend here. Cyrillic legibility is a requirement, not a taste question.
5. **Free forever, honest about limits.** No upsell path, and no softening the truths about browser storage, offline
   behavior, or provider cost. Say what the app cannot do before the learner discovers it.

## Accessibility & Inclusion

No formal WCAG conformance claim was requested and none should be stated. The bar is AA in practice with Cyrillic
priority: keyboard operability, correct screen-reader semantics, visible focus, touch-sized targets, and honouring
`prefers-reduced-motion`, as `TASK.md` specifies. Above checklist conformance, Russian-text legibility governs:
comfortable line length, sane hyphenation, Cyrillic-safe typefaces, adequate contrast. Dark mode was never requested
and is not a requirement.


