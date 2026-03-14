# Changelog

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

