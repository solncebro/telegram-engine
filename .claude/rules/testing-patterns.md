# Testing Patterns

## Структура

Тесты зеркалят `src/`. Каждый модуль имеет свой тестовый файл.

```
test/
├── core/           # accessControl, botRegistry, createBot, sender
├── menu/           # actionRouter, callbackEncoder, menuRouter, navigationSchema
├── message/        # deleteMessageList, markdownV2, messageTracker, splitMessage
├── input/          # inputStateManager, inputValidator
├── broadcast/      # broadcaster, reporter
├── command/        # commandRegistrar
├── utils/          # pause
└── exports.test.ts # проверка публичного API
```

## Запуск

```bash
yarn test                                    # все тесты
yarn test -- --testPathPattern=sender        # тесты по паттерну
yarn test -- --testPathPattern=core          # все тесты модуля core/
yarn test:coverage                           # с покрытием
```

## Мокирование Telegraf

### Module-level mock (createBot, botRegistry)

```typescript
jest.mock("telegraf", () => ({
  Telegraf: jest.fn().mockImplementation(() => ({
    launch: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
      setMyCommands: jest.fn().mockResolvedValue(true),
      // ...
    },
  })),
}));
```

Используется когда тестируемый модуль сам создаёт Telegraf-инстанс.

### Factory-mock (sender, broadcaster)

```typescript
const createMockTelegram = () => ({
  sendMessage: jest.fn().mockResolvedValue({ message_id: 42 }),
  pinChatMessage: jest.fn().mockResolvedValue(true),
  unpinChatMessage: jest.fn().mockResolvedValue(true),
  editMessageText: jest.fn().mockResolvedValue(true),
  deleteMessage: jest.fn().mockResolvedValue(true),
});

const createMockBot = (telegram) => ({ telegram }) as never;
```

Используется когда тестируемый модуль принимает бот/telegram через аргументы.

### Mock sender (broadcaster, reporter)

```typescript
const createMockSender = (): TelegramSender => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
  pinMessage: jest.fn().mockResolvedValue(undefined),
  unpinMessage: jest.fn().mockResolvedValue(undefined),
  editMessage: jest.fn().mockResolvedValue(undefined),
  deleteMessage: jest.fn().mockResolvedValue(undefined),
});
```

### Mock Telegram API (deleteMessageList)

```typescript
interface MockTelegram {
  deleteMessage: jest.Mock;
}

const createMockTelegram = (): MockTelegram => ({
  deleteMessage: jest.fn().mockResolvedValue(true),
});

// Передача:
await deleteMessageListById({ telegram: telegram as never, chatId: 123, ... });
```

Паттерн `as never` для приведения partial-мока к полному типу Telegraf.

## Тестирование ошибок

Ошибки моделируются через `mockRejectedValue` / `mockRejectedValueOnce`:

```typescript
(sender.sendMessage as jest.Mock).mockRejectedValueOnce(new Error("fail"));
```

Для цепочек success → fail → success:
```typescript
telegram.deleteMessage
  .mockResolvedValueOnce(true)
  .mockRejectedValueOnce(new Error("not found"))
  .mockResolvedValueOnce(true);
```

## exports.test.ts — Проверка публичного API

Использует `it.each()` для верификации что все ожидаемые экспорты доступны из `src/index.ts`:

```typescript
import * as TelegramEngine from "../src";

const expectedExportList = ["createBot", "createBotRegistry", ...];

it.each(expectedExportList)("should export %s", (exportName) => {
  expect(TelegramEngine[exportName]).toBeDefined();
});
```

При добавлении нового модуля — добавить его в этот список.

## Тестовые дженерики

Для тестирования дженерик-модулей (menu, input) создаются локальные тестовые типы:

```typescript
type TestStep = "main" | "settings";
type TestAction = "save" | "delete";

interface TestData {
  id: number;
  categoryId: string;
}
```

Это избавляет тесты от зависимости на конкретные доменные типы потребителя.

## Конфигурация Jest

- Preset: `ts-jest`
- Тесты: `test/**/*.test.ts`
- Coverage исключает: `src/index.ts`, `src/types/**`
- Моки автоматически очищаются (`clearMocks: true`, `restoreMocks: true`)
