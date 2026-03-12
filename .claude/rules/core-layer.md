# Core Layer — Управление ботами

`src/core/` — жизненный цикл Telegraf-инстансов, отправка сообщений, контроль доступа.

## accessControl.ts

```
createAccessControl({ allowedPeerList: string[] }) → AccessControl
```

Управляет белым списком peer ID (chatId). Хранит peer'ов во внутреннем `Set`.

- `isAllowedPeer(peer)` — возвращает `true`, если peer в списке. **Если список пустой — разрешает всем** (open access).
- `addPeer(peer)` / `removePeer(peer)` — динамическое управление.

Используется в `sender` и `commandRegistrar` для фильтрации входящих и исходящих взаимодействий.

## createBot.ts

```
createBot({ botToken, botName, onError? }) → BotInstance
```

Создаёт Telegraf-инстанс. **Не вызывает `launch()` автоматически** — потребитель решает когда запускать.

Возвращает:
- `bot` — сырой Telegraf-инстанс для регистрации хендлеров.
- `botName` — идентификатор бота в реестре.
- `launch()` — запуск polling. При ошибке: если передан `onError` — вызывает его, иначе `throw`.
- `stop(reason?)` — остановка бота.

## sender.ts

```
createSender({ getBot, accessControl?, onLog? }) → TelegramSender
```

Привязывает примитивы отправки к конкретному боту через `getBot()` (lazy — бот может быть ещё не создан на момент вызова `createSender`).

**Методы:**

| Метод | Сигнатура | Описание |
|-------|-----------|----------|
| `sendMessage` | `(args: SendMessageArgs) → Promise<void \| number>` | Отправка с access control, MarkdownV2, silent mode. При `returnMessageId: true` возвращает `message_id`. |
| `pinMessage` | `(chatId, messageId) → Promise<void>` | Закрепить сообщение. |
| `unpinMessage` | `(chatId, messageId) → Promise<void>` | Открепить сообщение. |
| `editMessage` | `(args: EditMessageArgs) → Promise<void>` | Редактирование текста с опциональным MarkdownV2. |
| `deleteMessage` | `(chatId, messageId) → Promise<void>` | Удаление сообщения. |

Все методы безопасны при `bot === undefined` — просто возвращают `void`.

Порядок проверок в `sendMessage`:
1. `accessControl.isAllowedPeer(peer)` — если не прошёл, логирует и return.
2. `getBot()` — если бот недоступен, логирует и return.
3. `telegram.sendMessage()` с опциями.

## botRegistry.ts

```
createBotRegistry({ allowedPeerList?, onLog? }) → BotRegistry
```

Реестр N ботов. Внутри: `Map<string, RegisteredBot>` + общий `AccessControl`.

При `register(args)` автоматически создаёт и бот (`createBot`), и sender (`createSender`) с общим access control. Потребителю не нужно связывать их вручную.

**Методы:**

| Метод | Описание |
|-------|----------|
| `register(args)` | Создаёт бот + sender, сохраняет в реестр. Возвращает `BotInstance`. |
| `get(botName)` | Возвращает `{ instance, sender }` или `undefined`. |
| `getBot(botName)` | Shortcut — возвращает сырой Telegraf или `undefined`. |
| `createSender(botName)` | Shortcut — возвращает `TelegramSender` или `undefined`. |
| `launchAll()` | Параллельный `launch()` всех ботов. |
| `stopAll(reason?)` | Параллельный `stop()` всех ботов. |

### Типичный flow потребителя

```
const registry = createBotRegistry({ allowedPeerList: ["123", "456"] });

const fundingBot = registry.register({ botToken: "...", botName: "Funding" });
const serviceBot = registry.register({ botToken: "...", botName: "Service" });

// Регистрация команд на сырых инстансах
registerBotCommands({ bot: fundingBot.bot, ... });

// Запуск всех
await registry.launchAll();

// Получение sender для рассылки
const sender = registry.createSender("Funding");
const broadcaster = createBroadcaster({ sender, recipientList: [...] });
```
