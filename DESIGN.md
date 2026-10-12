---
name: ЛИНГВА
description: Объяснение ошибок в языковых упражнениях
colors:
  paper: "#f3f1e9"
  surface: "#fffefa"
  ink: "#1c3028"
  muted: "#777e74"
  forest: "#244d3b"
  forest-deep: "#19392c"
  forest-soft: "#e4ede4"
  lime: "#d6e98a"
  coral: "#b85645"
  line: "#e4e2d6"
  line-strong: "#d5d2c5"
typography:
  display:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
    fontSize: "clamp(35px, 3.3vw, 43px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
    fontSize: "24px"
    fontWeight: 400
  title:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif'
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "0.14em"
  body:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", "Helvetica Neue", sans-serif'
    fontSize: "15px"
    fontWeight: 400
  label:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", "Helvetica Neue", sans-serif'
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.11em"
rounded:
  xs: "3px"
  sm: "8px"
  md: "9px"
  lg: "10px"
  xl: "12px"
  xxl: "14px"
  full: "20px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "45px"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
  button-soft:
    backgroundColor: "{colors.forest-soft}"
    textColor: "{colors.forest}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "45px"
  button-small:
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "37px"
  workspace-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xxl}"
  text-area:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "11px 13px"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
    height: "42px"
---

# Design System: ЛИНГВА

## Overview

**Creative North Star: "The Warm Editorial Desk" («Спокойный кабинет лингвиста»)**

ЛИНГВА is designed as a calm, focused, and distraction-free language learning workspace. It evokes the sensory atmosphere of a scholar's desk: warm tactile paper (`#f3f1e9`), soft cream card surfaces (`#fffefa`), deep dark green ink (`#1c3028`), and quiet botanical forest tones (`#244d3b`). The design creates an ambiance of deep concentration, deliberate study, and unhurried intellectual inquiry.

The interface is content-first, prioritizing legibility, clear semantic hierarchy, and Russian Cyrillic typography. Rather than overwhelming the learner with gamified badges, aggressive grading tones, or neon scorecards, ЛИНГВА presents structured, insightful linguistic explanations in a refined editorial setting.

**Key Characteristics:**
- **Warm Paper Atmosphere:** A tactile, low-fatigue background (`#f3f1e9`) layered with soft card surfaces (`#fffefa`) and delicate line dividers (`#e4e2d6`).
- **Editorial Typography:** Expressive serif headings paired with clean, highly legible neutral sans-serif body copy optimized for Russian Cyrillic glyphs.
- **Botanical Restraint:** Forest green anchors primary actions and active navigation states; electric lime accents (`#d6e98a`) are used strictly as precise focal points.
- **Flat-by-Default Elevation:** Subtle 1px structural borders and tonal layering take precedence over heavy drop shadows.
- **Calm, Purposeful Motion:** Lightweight transitions (180–200 ms) that respect `prefers-reduced-motion` and never delay user interaction.

## Colors

The palette is rooted in natural, warm paper and vegetable-ink tones, balanced by a sharp botanical accent.

### Primary
- **Forest Green** (`#244d3b` / `var(--forest)`): The primary brand anchor. Used for primary call-to-action buttons, active navigation item indicators, brand marks, toggle active states, and solid accent cards.
- **Forest Deep** (`#19392c` / `var(--forest-deep)`): Hover and active states for primary forest buttons.
- **Forest Soft** (`#e4ede4` / `var(--forest-soft)`): Soft tint background for active navigation items, secondary soft buttons, icon containers, and badges.

### Secondary / Accent
- **Electric Lime** (`#d6e98a` / `var(--lime)`): A high-contrast energetic botanical accent used for text selections (`::selection`), the brand mark monogram glyph, primary button action arrows (`↗`), blank-task pill tags, the note-glyph circle, and the provider-note icon.

### Destructive / Alert
- **Warm Coral** (`#b85645` / `var(--coral)`): Used for offline connection text and its status dot, `.text-danger`, the quiet danger button, delete-prompt hover, and the error toast mark.

### Neutral
- **Warm Paper** (`#f3f1e9` / `var(--paper)`): The foundational root canvas background. Reduces eye strain during prolonged reading and study sessions.
- **Surface Ivory** (`#fffefa` / `var(--surface)`): Crisp card containers, workspace surfaces, text inputs, and dialogs.
- **Deep Forest Ink** (`#1c3028` / `var(--ink)`): High-contrast primary text and heading color.
- **Muted Sage** (`#777e74` / `var(--muted)`): Ledes, captions and eyebrows, dates, empty-state text, card subtitles, and unselected task-switch text.
- **Ambient Line** (`#e4e2d6` / `var(--line)`): 1px structural borders dividing cards, rows, and workspace sections.
- **Line Strong** (`#d5d2c5` / `var(--line-strong)`): Border on the segmented task-switch container.

### Named Rules
**The Warm Paper Rule.** All primary workspace backgrounds must use Warm Paper (`#f3f1e9`) or Surface Ivory (`#fffefa`). Pure cold white (`#ffffff`) is strictly prohibited for main content backgrounds.

**The Lime Rarity Rule.** Electric Lime (`#d6e98a`) is a high-visibility accent reserved exclusively for selections, arrows, and key micro-indicators. It must never cover large container backgrounds or body text.

## Typography

**Display Font:** `"Iowan Old Style"`, `"Palatino Linotype"`, `"Book Antiqua"`, Georgia, serif (`var(--serif)`)
**Body Font:** `"Avenir Next"`, Avenir, `"Segoe UI"`, `"Helvetica Neue"`, sans-serif (`var(--sans)`)
**Code/Mono Font:** `ui-monospace`, SFMono-Regular, Menlo, monospace

The typographic pairing contrasts an intellectual, editorial serif for titles with a modern, clean geometric sans-serif for UI labels, interactive controls, and Russian explanation text.

### Hierarchy
- **Display** (weight 400, `clamp(35px, 3.3vw, 43px)`, line-height 1.12, letter-spacing `-0.03em`, selector `h1`): Top-level page titles. On mobile phones (<521px), base size is 32px; on portrait viewports (>=521px), base size is 35px; on tablet and desktop (>=761px), scales responsively via clamp.
- **Headline** (weight 400, 24px, selector `.empty-state h2`, `.modal-head h2` at 27px, `.result-top h2` at 23px): Major state headings, modal titles, and section intros.
- **Title** (weight 700, 20px, letter-spacing `0.14em`, selector `.brand`): Brand title (`ЛИНГВА`). Card section titles (`.card-heading h2`) also use 20px serif at regular weight (400).
- **Body** (weight 400, 15px, selector `body`): Foundational interface text. Long-form explanation markdown (`.markdown`) renders at 14px with line-height 1.75.
- **Label / Eyebrow** (weight 700, 10px, letter-spacing `0.11em` / `0.13em`, uppercase, selector `.field-label`, `.sidebar-caption`, `.eyebrow`): Form field labels, kicker tags, and sidebar captions.

### Responsive Step-Up Scale
The typography system employs a mobile-first step-up scale where base font sizes shift up uniformly across larger breakpoints:
- **Tablet (>=768px):** All font sizes shift +1px (Display becomes `clamp(36px, 3.3vw, 44px)`).
- **Desktop (>=1024px):** All font sizes shift +4px (Display becomes `clamp(39px, 3.3vw, 47px)`).
- **Wide Desktop (>=1440px):** All font sizes shift +6px, minimum font size 14px (Display becomes `clamp(41px, 3.3vw, 49px)`).
- **Ultra-Wide (>=2560px):** All font sizes shift +8px, minimum font size 16px (Display becomes `clamp(43px, 3.3vw, 51px)`).

### Named Rules
**The Cyrillic Legibility Rule.** All typography stacks must prioritize native Cyrillic glyph rendering with generous line-height (1.55 to 1.75 on prose copy) and constrained reading widths across viewports.

**The Editorial Hierarchy Rule.** Headings (`h1`, `h2`, `h3` in brand and section contexts) always use the serif family (`var(--serif)`), while interactive controls, buttons, forms, and data tables use the sans-serif family (`var(--sans)`).

## Layout

The spatial model balances a desktop editorial layout with a thumb-friendly mobile PWA experience.

- **Content Max Width:** Standard container capped at 1110px (`--content-max: 1110px`), widening to 1440px on ultra-wide viewports (>=1440px).
- **Page Container Max Widths:**
  - Explanation workspace (`.explain-page`): 825px on mobile/tablet, 900px at >=768px, 1040px at >=1024px, and 1440px at >=1440px.
  - History, Prompts, and Instruction pages (`.history-list`, `.prompt-list`, `.instruction-page`): 850px, expanding to 1440px at >=1440px.
- **Sidebar Shell (Desktop >=761px):** Fixed left navigation rail (248px on >=1051px wide desktop, 218px on tablet) with 1px border separation (`#e0ded2`), housing the brand mark, navigation destinations, and connection telemetry.
- **Mobile Navigation (<761px):** Sticky top bar (58px height) with brand title and connection indicator, paired with a fixed bottom navigation bar (63px + `safe-area-inset-bottom`) hosting 5 equal icon-and-label tabs.
- **Spacing Rhythm:** Dense and slightly irregular typographic rhythm using deliberate 7px to 23px step increments (`.word-list` gap 7px, `.blank-segment` gap 9px, `.settings-main` gap 13px, `.answer-grid` gap 15px, `.field` margin-bottom 21px), rather than a rigid synthetic grid. Form card padding scales responsively (`18px 14px` on mobile, `clamp(22px, 3vw, 34px)` on desktop).

## Elevation & Depth

ЛИНГВА employs a flat-by-default, print-inspired depth model. Physical layers are differentiated by tonal contrast and crisp hairline borders rather than heavy drop shadows.

### Shadow Vocabulary
- **Card Ambient** (`box-shadow: 0 2px 5px rgba(28, 48, 40, 0.025)`): Subtle resting depth on workspace cards against the paper canvas.
- **Toast Elevation** (`box-shadow: 0 8px 25px #1c30281a`): Floating status toast notifications and transient alerts.
- **Input Focus Glow** (`box-shadow: 0 0 0 3px rgba(145, 170, 132, 0.13)`): Soft diffuse focus glow around active text inputs and word fields.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flat on the paper plane. Depth is communicated through background value shifts (`#f3f1e9` -> `#fffefa` -> `#f8f7f1`) and ambient hairline borders.

## Shapes

Shapes reflect a stationery aesthetic with gentle curves and a signature asymmetric notch.

- **Brand Notch (3px / `xs`):** The signature asymmetrical bottom-left corner on the brand mark (`border-radius: 10px 10px 10px 3px` on desktop, `8px 8px 8px 2px` on mobile).
- **Standard Controls (8px / `sm`):** Text areas, text inputs, word item rows, icon buttons, add-word buttons, blank segments, and privacy notes.
- **Interactive Buttons & Nav (9px / `md`):** Navigation links, action buttons, inline alerts, and add-prompt icons.
- **Segmented Controls & Utility Surfaces (10px / `lg`):** Task switcher containers, toast notifications, install cards, and instruction header icons.
- **Intermediate Cards (12px / `xl`):** Loading card and privacy card.
- **Workspace Containers (14px / `xxl`):** Primary workspace cards, prompt cards, and add-prompt card.
- **Modals:** Mobile bottom sheet uses `16px 16px 0 0` top radius; desktop modal uses `0` radius inside backdrop.
- **Pills & Toggles (20px / `full`):** Status badges, count badges, blank tags, builtin tags, and switch toggles.

### Named Rules
**The Signature Notch Rule.** The asymmetrical 3px corner notch is reserved exclusively for the primary ЛИНГВА brand emblem, lending it a distinctive monogram character.

## Components

### Focus & Accessibility
- **Global Focus Ring:** Keyboard focus on all interactive elements (`button:focus-visible`, `a:focus-visible`, `input:focus-visible`, `textarea:focus-visible`, `select:focus-visible`, `.switch input:focus-visible + span`) receives `outline: 3px solid #91aa57; outline-offset: 3px`.
- **Disabled State:** Disabled action buttons use `opacity: 0.48; cursor: not-allowed;`. Disabled icon buttons use `opacity: 0.28; cursor: not-allowed;`.
- **Touch Targets:** On coarse pointer devices (`@media (pointer: coarse)`), buttons, inputs, and icon controls receive 44px tap targets; the switch control grows to 44×26px.

### Buttons
- **Shape:** Gently rounded corners (9px radius, modifier `md`).
- **Primary Action Button:** Solid Forest Green (`#244d3b`), Surface Ivory text (`#fffefa`), min-height 45px, padding `0 18px`. Includes an Electric Lime action arrow glyph `↗` (`.button-arrow`).
- **Hover / Focus:** Transitions background to Forest Deep (`#19392c`) with a `-1px` vertical lift (`transform: translateY(-1px)`).
- **Soft Secondary Button:** Soft Forest tint background (`#e4ede4`), Forest Green text (`#244d3b`), min-height 45px, padding `0 18px`, hover background `#dbe8d9`.
- **Small Button Modifier:** Min-height 37px, padding `0 13px`, font size 11px.
- **Outline Button:** 1px border (`#d8d8cb`), Surface Ivory background, Forest Green text, hover border `#9aac8e` and background `#f7f9f3`.
- **Quiet Danger Button:** 1px border (`#e7d2cb`), Warm Coral text (`#b85645`), transparent background, min-height 38px, padding `0 14px`, hover background `#fff5f1`.
- **Icon Button:** 34x34px (44x44px touch floor), 8px radius, transparent background, `#8b9086` glyph, hover background `#f2f1e9` and ink text.

### Inputs / Fields
- **Word Input Row:** 8px radius, min-height 45px, 1px solid `var(--line)`, Surface Ivory background, padding `3px 6px 3px 10px`. Features a serif index number (`#a2a499`) and embedded delete button. Focus within applies border `#91aa84` and diffuse glow.
- **Text Area:** 8px radius, 1px solid `var(--line)`, padding `11px 13px`, font size 14px, line-height 1.55, vertical resize. Focus applies border `#91aa84` and diffuse glow.
- **Text Input:** 8px radius, 1px solid `var(--line)`, padding `9px 12px`, min-height 42px, font size 13px. Focus applies border `#91aa84` and diffuse glow.
- **Learner vs. Correct Highlights:** Learner error input uses warm rose accent border (`#e0c8bd`) and `#fffdfa` background; correct answer input uses soft sage border (`#cfdacd`).

### Cards & Containers
- **Workspace Card:** 14px radius, 1px solid `var(--line)`, Surface Ivory background (`#fffefa`), subtle 0 2px 5px shadow. Form card internal padding is `18px 14px` on mobile, scaling to `clamp(22px, 3vw, 34px)` on desktop. Settings card padding is `18px 14px` on mobile, `22px` on desktop.
- **Blank Segment:** 8px radius, 1px solid `var(--line)`, `#f8f7f1` neutral background, padding `9px 10px`.
- **Provider Note Card:** Solid Forest Green card (`#244d3b`) with 13px radius, padding 19px, Ivory text (`#fffefa`), and translucent Lime icon pill.

### Task Switcher
- **Container:** Segmented control container with 10px radius, 1px solid `var(--line-strong)`, `#f8f7f1` background. Full-width on mobile, auto-width on desktop.
- **Buttons:** Min-height 39px (44px on coarse pointer), padding `0 19px` (`0 10px` on mobile), muted text (`#777e74`). Selected state transitions to Forest Green (`#244d3b`) background with Surface Ivory text (`#fffefa`).

### Navigation
- **Sidebar Nav Link:** Height 44px, 9px radius, padding `0 12px`, text `#505b52`, hover background `rgba(228, 237, 228, 0.65)`. Active state uses Forest Soft background (`#e4ede4`) and Forest Green text with 650 font weight.
- **Mobile Bottom Nav:** Fixed 5-tab grid, height `63px + safe-area`, backdrop blur 14px, 1px top border `#dfded3`, active tab highlighted in Forest Green.

### Badges & Status Indicators
- **Type Badge:** 20px pill radius, Forest Soft background (`#e4ede4`), Forest Green text (`#244d3b`), 9px uppercase text.
- **Blank Tag:** 20px pill radius, Electric Lime background (`#d6e98a`), Forest Green text (`#244d3b`), 9px uppercase text.
- **Status Dot:** 7x7px circle (6x6px on mobile), Botanical Green (`#789b61`) for online state, Warm Coral (`#b85645`) for offline state.

## Do's and Don'ts

### Do:
- **Do** preserve the warm paper atmosphere by anchoring surfaces to `--paper` (`#f3f1e9`) and `--surface` (`#fffefa`).
- **Do** use serif display headings (`var(--serif)`) for page titles and prominent modal headings.
- **Do** keep all interface labels, empty states, and notifications in natural, idiomatic Russian (`ru-RU`).
- **Do** enforce 44px minimum touch targets on coarse pointer devices (`@media (pointer: coarse)`).
- **Do** respect user motion preferences by reducing transitions and animations to `.01ms` under `prefers-reduced-motion`.
- **Do** apply the standard 3px `#91aa57` focus outline to all interactive elements for accessible keyboard navigation.

### Don't:
- **Don't** use cold stark white (`#ffffff`) or generic pure black (`#000000`) in UI canvases or body text.
- **Don't** use heavy drop shadows, intense glowing blurs, or skeuomorphic gradients.
- **Don't** use Electric Lime (`#d6e98a`) as a background for large cards, dialogs, or body text containers.
- **Don't** introduce English strings or untranslated UI placeholders into the interface.
- **Don't** add decorative animations or transitions exceeding 200 ms that delay user task completion.
- **Don't** use gamified grading colors (harsh red/green score banners) that distract from linguistic explanations.
