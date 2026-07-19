# Broadcast & Command — Рассылка и регистрация команд

## Broadcast (`src/broadcast/`)

### broadcastToRecipients.ts — Универсальный fan-out

```
broadcastToRecipients({ recipientList, sendToPeer, onLog?, errorLogMessage? }) → Promise<void>
```

Низкоуровневый примитив рассылки: `sendToPeer(peer)` вызывается для каждого получателя параллельно (`Promise.all`), каждый — в своём try/catch, поэтому один упавший чат не блокирует остальных (ошибка логируется через `onLog`, не бросается; текст по умолчанию `"Failed to send to peer"`, переопределяется через `errorLogMessage`). Содержимое и parse mode задаёт сам `sendToPeer` — примитив агностичен к виду сообщения (текст, готовый MarkdownV2, фото). Это единый механизм рассылки: `createBroadcaster` (sendToAll/sendChunkedToAll/sendAndPin) построен поверх него, и его же используют потребители, рассылающие свои сообщения (например, `TelegramNotifier` из trade-engine — текст; rubber — фото-график по всем чатам).

### broadcaster.ts — Отправка всем пользователям

```
createBroadcaster({ sender, recipientList, onLog? }) → Broadcaster
```

Оборачивает `TelegramSender` для массовой рассылки по `recipientList` поверх `broadcastToRecipients`. Все ошибки ловятся per-peer — один упавший отправитель не блокирует остальных.

**Методы:**

#### `sendToAll(message, useMarkdownV2?)`
Параллельная отправка одного сообщения всем получателям через `Promise.all()`. Ошибки логируются через `onLog`, не бросаются.

#### `sendChunkedToAll(messageList, pauseDuration?, useMarkdownV2?)`
Отправка нескольких сообщений каждому получателю **последовательно** (с паузой между чанками). Получатели обрабатываются параллельно. По умолчанию `pauseDuration = 300ms`.

Используется для длинных отчётов, разбитых через `splitMessageToChunkList()`.

#### `sendAndPin(args: SendAndPinArgs)`
Отправляет сообщение с `returnMessageId: true`, затем закрепляет.

Управляет FIFO-очередью закреплённых сообщений:
- `pinnedMessageIdListByChatId` — `Map<string, number[]>`, передаётся потребителем. Broadcaster мутирует его напрямую.
- При превышении `maxPinnedCount` (по умолчанию 10): открепляет самый старый (`list[0]`), удаляет из начала списка.
- Новый `messageId` добавляется в конец.

### reporter.ts — Retry-обёртка

```
createReporter({ broadcaster }) → Reporter
```

**`reportEvent(message, useMarkdownV2?)`** — вызывает `broadcaster.sendToAll()`. При ошибке — одна повторная попытка с суффиксом ` (retry)`.

**`reportError(message, error)`** — аналогично, но без MarkdownV2. Параметр `error` зарезервирован для будущего использования (логирование деталей ошибки).

---

## Command (`src/command/`)

### commandRegistrar.ts — Декларативная регистрация

```
registerBotCommands({
  bot,
  accessControl?,
  commandConfigList,
  callbackQueryHandler?,
  messageHandler?,
  onError?,
}) → Promise<void>
```

Конфигурирует Telegraf-бот в одном вызове. Выполняет 5 действий последовательно:

**1. Регистрация команд в Telegram**
```
bot.telegram.setMyCommands([{ command, description }, ...])
```
Устанавливает подсказки команд в UI Telegram.

**2. Регистрация command-хендлеров**
Для каждого элемента `commandConfigList`:
```
bot.command(cmd, async (ctx) => { ... })
```
Каждый хендлер обёрнут в access control check + try-catch.

**3. Callback query handler** (опциональный)
```
bot.on("callback_query", async (ctx) => { ... })
```
Единый обработчик для всех inline-кнопок. Потребитель внутри парсит `callback_data` через свой `callbackEncoder.decode()`.

**4. Message handler** (опциональный)
```
bot.on("message", async (ctx) => { ... })
```
Для обработки текстового ввода пользователя (используется совместно с `inputStateManager`).

**5. Error catcher**
```
bot.catch((error, ctx) => { ... })
```
Catch-all для необработанных ошибок. Логирует через `onError`.

### Access control flow

Все хендлеры (command, callback_query, message) проходят через общую проверку:
```
const chatId = context.chat?.id ?? ""
if (!accessControl.isAllowedPeer(chatId)) return
```

Если `accessControl` не передан — все запросы разрешены.

### CommandConfig

```typescript
{
  command: string,                              // "menu", "symbol_info"
  description: string,                          // описание для /setMyCommands
  handler: (context: Context) => Promise<void>, // бизнес-логика
}
```
