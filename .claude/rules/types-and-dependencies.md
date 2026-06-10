# Типы и граф зависимостей

## Расположение типов

Все типы живут в `src/types/*.types.ts`. Определять типы inline в implementation-файлах запрещено.

| Файл | Содержимое |
|------|-----------|
| `bot.types.ts` | CreateBotArgs, BotInstance, AccessControl, TelegramSender, BotRegistry, LogFunction, SendMessageArgs, EditMessageArgs |
| `menu.types.ts` | FieldConfig, CallbackEncoder, ButtonConfig, KeyboardBuilder, NavigationStepSchema, NavigationSchema, MenuStepResult, MenuRouter, ActionRouter, StepHandlerMap, ActionHandlerMap, CreateMenuTreeArgs, MenuTree, BuildPresetKeyboardArgs |
| `keyboard.types.ts` | RawInlineButton, RawInlineKeyboardMarkup |
| `lifecycle.types.ts` | MenuSurface, MenuReplacer, LoadingController, LoadingHandle, BuildDismissReplyMarkupArgs, ReplaceMenuArgs |
| `wizard.types.ts` | Wizard |
| `input.types.ts` | InputState, InputStateManager, ValidateIntegerAndPositiveResult, ParseCommaSeparatedRangeResult |
| `message.types.ts` | MessageTracker, DeleteMessageListByIdArgs, FormattingMarkerItem |
| `broadcast.types.ts` | CreateBroadcasterArgs, SendAndPinArgs, Broadcaster, Reporter |
| `command.types.ts` | CommandConfig, RegisterBotCommandsArgs |

## Ключевые типы

### LogFunction
```typescript
(message: string, data?: Record<string, unknown>) => void
```
Единый контракт логирования. Используется в sender, broadcaster, commandRegistrar, deleteMessageList. Потребитель подключает свой логгер:
```typescript
const onLog: LogFunction = (msg, data) => pinoLogger.info(data, msg);
```

### TelegramSender
Основной интерфейс отправки. 5 методов: sendMessage, pinMessage, unpinMessage, editMessage, deleteMessage. Создаётся через `createSender()` или через `botRegistry.createSender()`.

### MenuStepResult
```typescript
{ messageList: string[], keyboard: InlineKeyboard }
```
Универсальный результат рендеринга шага меню. `messageList` может содержать несколько сообщений для длинного контента.

### InlineKeyboard
Alias для `ReturnType<typeof Markup.inlineKeyboard>` из Telegraf.

## Граф зависимостей модулей

```
                    ┌─────────────────┐
                    │   src/index.ts  │  (barrel — реэкспорт всего)
                    └────────┬────────┘
          ┌──────────────────┼──────────────────────────┐
          ▼                  ▼                           ▼
    ┌───────────┐    ┌──────────────┐           ┌──────────────┐
    │  core/    │    │    menu/     │           │  broadcast/  │
    │           │    │              │           │              │
    │ botReg ◄──┼─┐  │ cbEncoder   │           │ broadcaster  │
    │ createBot │ │  │ kbBuilder   │           │   ▲          │
    │ sender    │ │  │ navSchema   │           │   │ reporter  │
    │ accessCtl │ │  │ menuRouter  │           └───┼──────────┘
    └───────────┘ │  │ actionRouter│               │
                  │  └──────────────┘               │
                  │                                  │
    ┌───────────┐ │  ┌──────────────┐               │
    │ command/  │ │  │   message/   │               │
    │           │ │  │              │               │
    │ cmdReg ───┘  │ markdownV2   │               │
    │           │  │ splitMessage │               │
    └───────────┘  │ msgTracker  │               │
                   │ deleteMsgList│               │
                   └──────────────┘               │
                                                   │
    ┌───────────┐  ┌──────────────┐               │
    │  input/   │  │    utils/    │               │
    │           │  │              │               │
    │ stateMan  │  │ pause ───────┼───────────────┘
    │ validator │  │ constants    │
    └───────────┘  └──────────────┘
```

### Зависимости между модулями

| Модуль | Зависит от |
|--------|-----------|
| `core/botRegistry` | `core/createBot`, `core/sender`, `core/accessControl` |
| `core/createBot` | `core/botCrashGuard`, Telegraf, `types/bot.types` |
| `core/botCrashGuard` | Telegraf |
| `core/sender` | `types/bot.types` |
| `menu/menuTree` | `menu/navigationSchema`, `types/menu.types`, `types/keyboard.types` |
| `menu/menuReplacer` | `menu/menuMessageList`, `message/telegramEditError`, `types/lifecycle.types` |
| `menu/loadingController` | `types/lifecycle.types` |
| `menu/dismissKeyboard` | `types/lifecycle.types` |
| `menu/wizard` | `types/wizard.types` |
| `menu/presetKeyboard` | `types/menu.types`, `types/keyboard.types` |
| `menu/recentList` | `types/menu.types` |
| `menu/menuMessageList` | `types/menu.types` |
| `message/telegramEditError` | полностью автономен |
| `message/editMessageWithFallback` | Telegraf Context |
| `menu/keyboardBuilder` | `menu/callbackEncoder` (через переданный encoder) |
| `message/splitMessage` | `utils/constants` |
| `message/deleteMessageList` | `types/message.types` |
| `broadcast/broadcaster` | `utils/pause`, `utils/constants`, `types/broadcast.types` |
| `broadcast/reporter` | `types/broadcast.types` (через broadcaster) |
| `command/commandRegistrar` | `types/command.types` |

### Standalone-модули (нет зависимостей от других модулей)

- `core/accessControl` — только типы
- `core/botCrashGuard` — только Telegraf
- `menu/callbackEncoder` — только типы
- `menu/navigationSchema` — только типы
- `menu/menuRouter` — только типы
- `menu/actionRouter` — только типы
- `message/markdownV2` — полностью автономен
- `message/messageTracker` — только типы
- `input/inputValidator` — только типы
- `input/inputStateManager` — только типы
- `utils/pause` — полностью автономен
- `utils/constants` — полностью автономен

### Внешние зависимости

Единственная runtime-зависимость: **telegraf ^4.16.3**.

Из telegraf используются:
- `Telegraf` — класс бота (core/createBot, core/sender, types)
- `Context` — тип контекста хендлера (command/commandRegistrar, types)
- `Markup` — построение inline-клавиатур (menu/keyboardBuilder)
- `Telegram` — тип API-клиента (types/message.types)
