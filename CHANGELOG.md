# Changelog

## 0.3.0

Menu lifecycle toolkit, wizard sessions, crash guard for long polling, and resilient message editing.

### Features

**Core**
- **`applyBotCrashGuard`** — Registers `bot.catch` so a single failing handler does not abort long polling for the entire bot. `createBot` applies it automatically; optional `onError` receives the error and the failing update.
- **`BotCrashGuardArgs`** — Type for crash guard configuration.

**Menu — lifecycle & navigation**
- **`createMenuTree`** — Screen tree over `createNavigationSchema`: parent lookup, optional dynamic parent resolver, and a standard `[Back][Close]` footer row.
- **`createMenuReplacer`** — Menu message lifecycle: replace screen, close only, delete tracked messages; benign edit/delete errors are ignored via `isBenignTelegramEditError`.
- **`createLoadingController`** — Loading indicator for callback and reply buttons (`LoadingHandle` with `finalize`).
- **`buildDismissReplyMarkup`** / **`dismissKeyboard`** — Remove inline keyboard while keeping message text.
- **`createWizard`** — Generic multi-step session store keyed by chat (or any string key): `start`, `get`, `patch`, `reset`, `isActive`.
- **`buildPresetKeyboard`** / **`buildPresetDisplayList`** / **`promoteToFront`** — Preset value buttons and recent-value list helpers.
- **`buildMessageIdListToDelete`** — Builds message ID list for cleanup (tracked IDs + callback message).

**Message**
- **`isBenignTelegramEditError`** — Detects harmless Telegram edit/delete errors (not modified, not found, query too old, etc.).
- **`editMessageWithFallback`** — Tries `editMessageCaption`, falls back to `editMessageText` when caption/text mismatch.

**Types**
- **`keyboard.types.ts`** — `RawInlineButton`, `RawInlineKeyboardMarkup`.
- **`lifecycle.types.ts`** — `MenuSurface`, `MenuReplacer`, `LoadingController`, `BuildDismissReplyMarkupArgs`, and related types.
- **`wizard.types.ts`** — `Wizard<TState>`.
- Extended **`menu.types.ts`** — `CreateMenuTreeArgs`, `MenuTree`, `BuildPresetKeyboardArgs`, and related types.

### Improvements

- **`createBot`** — Crash guard is applied on every new bot instance.
- **README** — Full guide for menu lifecycle, wizard flows, preset keyboards, and updated API reference table.

---

## 0.2.0

**BREAKING CHANGES**

- **`md` renamed to `markdownV2Builder`** — The `md` export violated the no-abbreviations code style rule. All usages must be updated: `md.bold(...)` → `markdownV2Builder.bold(...)`.
- **`MAX_RETRY_COUNT` removed** — Dead code, was exported but never imported anywhere.
- **`DeleteMessageListArgs` type removed** — Dead code, was defined but never used (only `DeleteMessageListByIdArgs` is used).

### Features

- **`DEFAULT_MAX_PINNED_COUNT`** — New named constant (value: 10) exported from utils, used in `broadcaster.sendAndPin()` instead of magic number.

### Improvements

- **reporter.ts** — Deduplicated retry logic: extracted `sendWithRetry` helper inside the closure, reducing ~15 lines of duplicate try-catch code.
- **splitMessage.ts** — Added `trimEnd()` for oversized lines (consistency with other code paths that already apply `trimEnd()`).

---

## 0.1.1

Enhanced MarkdownV2 support with intelligent formatting preservation and builder utilities.

### Features

- **escapeMarkdownV2WithFormatting** — Smart escaping that preserves bold, italic, code blocks, spoilers while escaping unformatted text. Recognizes paired formatting markers (`*bold*`, `` `code` ``, `||spoiler||`, `_italic_`, `~strikethrough~`) and escapes only the content inside them, leaving markers intact.
- **md builder object** — Convenient helper methods for MarkdownV2 formatting:
  - `md.bold(text)` — bold text with automatic escaping
  - `md.italic(text)` — italic text with automatic escaping
  - `md.code(text)` — inline code (no content escaping)
  - `md.strikethrough(text)` — strikethrough with escaping
  - `md.spoiler(text)` — spoiler text with escaping
  - `md.link(text, url)` — hyperlink with escaped text and URL
  - `md.escape(text)` — raw character escaping without markers
- Comprehensive test suite with real-world message patterns from kliner-autotrade-funding (Firebase settings, daily reports, system state messages)
- Updated documentation with examples and usage patterns

---

## 0.1.0

Initial release.

### Features

- **core** — `createBot`, `createBotRegistry`, `createSender`, `createAccessControl`
- **menu** — `createCallbackEncoder`, `createKeyboardBuilder`, `createMenuRouter`, `createActionRouter`, `createNavigationSchema`
- **input** — `createInputStateManager`, `validatePositiveNumber`, `validateIntegerAndPositive`, `parseCommaSeparatedRange`
- **message** — `escapeMarkdownV2Text`, `formatClickableText`, `splitMessageToChunkList`, `createMessageTracker`, `deleteMessageListById`
- **broadcast** — `createBroadcaster`, `createReporter`
- **command** — `registerBotCommands`
- **utils** — `pause`, `TELEGRAM_MESSAGE_MAX_LENGTH`, `DEFAULT_BROADCAST_PAUSE_MS`

