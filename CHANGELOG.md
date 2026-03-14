# Changelog

## 0.1.1

Enhanced MarkdownV2 support with intelligent formatting preservation.

### Features

- **escapeMarkdownV2WithFormatting** — Smart escaping that preserves bold, italic, code blocks, spoilers while escaping unformatted text
- **md builder object** — Helper methods for bold, italic, code, strikethrough, spoiler, link, and escape
- Comprehensive test suite with real-world message patterns from kliner-autotrade-funding

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

