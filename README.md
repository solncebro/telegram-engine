# @solncebro/telegram-engine

Универсальная TypeScript-библиотека для Telegram ботов на базе [Telegraf](https://telegraf.js.org/) v4.

Предоставляет готовые механизмы: реестр ботов, inline-меню с навигацией, MarkdownV2, рассылка с pin'ами, управление вводом пользователя, декларативная регистрация команд.

Библиотека не привязана к доменной логике — потребитель определяет свои enum'ы, типы и обработчики через дженерики и конфигурацию.

---

## Установка

```bash
yarn add @solncebro/telegram-engine
```

Единственная runtime-зависимость — `telegraf ^4.16.3` (устанавливается автоматически).

---

## Быстрый старт

Минимальный бот за 20 строк:

```typescript
import {
  createBotRegistry,
  registerBotCommands,
} from "@solncebro/telegram-engine";

const registry = createBotRegistry({
  allowedPeerList: ["123456789"],
  onLog: (message, data) => console.log(message, data),
});

const bot = registry.register({
  botToken: "YOUR_BOT_TOKEN",
  botName: "MyBot",
});

await registerBotCommands({
  bot: bot.bot,
  commandConfigList: [
    {
      command: "start",
      description: "Запуск бота",
      handler: async (ctx) => {
        await ctx.reply("Привет!");
      },
    },
  ],
});

await registry.launchAll();
```

---

## Руководство по модулям

### 1. Core — Управление ботами

#### createBotRegistry — Реестр ботов

Центральная точка управления N ботами. Создаёт ботов, sender'ов и access control автоматически.

```typescript
import { createBotRegistry } from "@solncebro/telegram-engine";

const registry = createBotRegistry({
  // Список chat ID, которым разрешено взаимодействовать с ботами.
  // Пустой массив или отсутствие — разрешено всем.
  allowedPeerList: ["111111", "222222"],

  // Callback для логирования. Подключи свой логгер.
  onLog: (message, data) => logger.info(data, message),
});
```

Регистрация ботов:

```typescript
const serviceBot = registry.register({
  botToken: process.env.SERVICE_BOT_TOKEN!,
  botName: "Service",
  onError: (error, botName) => {
    logger.error({ error }, `Failed to launch ${botName}`);
  },
});

const notificationBot = registry.register({
  botToken: process.env.NOTIFICATION_BOT_TOKEN!,
  botName: "Notification",
});

// Запуск всех ботов
await registry.launchAll();

// Остановка (например, при SIGTERM)
process.on("SIGTERM", async () => {
  await registry.stopAll("SIGTERM");
});
```

Получение бота или sender'а по имени:

```typescript
const bot = registry.getBot("Service");       // Telegraf | undefined
const sender = registry.createSender("Service"); // TelegramSender | undefined
const registered = registry.get("Service");      // { instance, sender } | undefined
```

#### createBot — Одиночный бот

Если реестр не нужен:

```typescript
import { createBot } from "@solncebro/telegram-engine";

const instance = createBot({
  botToken: "TOKEN",
  botName: "MyBot",
  onError: (error, name) => console.error(name, error),
});

// Бот не запускается автоматически — ты контролируешь момент запуска
await instance.launch();

// Telegraf-инстанс для регистрации хендлеров
instance.bot.command("ping", (ctx) => ctx.reply("pong"));
```

#### createAccessControl — Контроль доступа

```typescript
import { createAccessControl } from "@solncebro/telegram-engine";

const ac = createAccessControl({ allowedPeerList: ["123", "456"] });

ac.isAllowedPeer("123");  // true
ac.isAllowedPeer("789");  // false

// Динамическое управление
ac.addPeer("789");
ac.removePeer("456");

// Пустой список = разрешено всем
const openAc = createAccessControl({ allowedPeerList: [] });
openAc.isAllowedPeer("любой");  // true
```

#### createSender — Отправка сообщений

Привязывает функции отправки к конкретному боту:

```typescript
import { createSender, createAccessControl } from "@solncebro/telegram-engine";

const sender = createSender({
  getBot: () => myTelegrafInstance,  // ленивая загрузка — бот может быть создан позже
  accessControl: createAccessControl({ allowedPeerList: ["123"] }),
  onLog: (msg) => console.log(msg),
});

// Отправка сообщения
await sender.sendMessage({
  message: "Привет!",
  peer: "123456789",
  useMarkdownV2: true,      // опционально
  isSilentMessage: false,    // опционально
  returnMessageId: false,    // опционально — если true, возвращает number
});

// Отправка + получение message_id
const messageId = await sender.sendMessage({
  message: "Важное сообщение",
  peer: "123456789",
  returnMessageId: true,
});

// Закрепление / открепление
await sender.pinMessage("123456789", messageId as number);
await sender.unpinMessage("123456789", messageId as number);

// Редактирование
await sender.editMessage({
  chatId: "123456789",
  messageId: 42,
  text: "Обновлённый текст",
  useMarkdownV2: true,
});

// Удаление
await sender.deleteMessage("123456789", 42);
```

Все методы безопасны: если бот не создан (`getBot()` вернул `undefined`) или peer не разрешён — метод завершается без ошибки.

---

### 2. Menu — Система inline-меню

Полноценная навигация по inline-клавиатурам с поддержкой Back/Main menu, валидацией параметров и роутингом шагов.

#### Шаг 1: Определи свои типы

```typescript
// types/menu.types.ts в твоём проекте

enum MenuStepEnum {
  main = "main",
  settings = "settings",
  selectCategory = "selectCategory",
  categoryDetail = "categoryDetail",
}

enum MenuActionEnum {
  toggleFeature = "toggleFeature",
  changeValue = "changeValue",
  back = "back",
  closeMenu = "closeMenu",
}

interface MenuCallbackData {
  step?: MenuStepEnum;
  action?: MenuActionEnum;
  categoryId?: string;
  page?: number;
}
```

#### Шаг 2: Настрой callbackEncoder

Telegram ограничивает `callback_data` до 64 байт. Encoder сжимает данные через short-коды:

```typescript
import {
  createCallbackEncoder,
  type FieldConfig,
} from "@solncebro/telegram-engine";

// Short-коды для enum-значений
const stepCodeByValue: Record<MenuStepEnum, string> = {
  [MenuStepEnum.main]: "m",
  [MenuStepEnum.settings]: "s",
  [MenuStepEnum.selectCategory]: "sc",
  [MenuStepEnum.categoryDetail]: "cd",
};
const stepValueByCode = Object.fromEntries(
  Object.entries(stepCodeByValue).map(([k, v]) => [v, k]),
) as Record<string, MenuStepEnum>;

const actionCodeByValue: Record<MenuActionEnum, string> = {
  [MenuActionEnum.toggleFeature]: "tf",
  [MenuActionEnum.changeValue]: "cv",
  [MenuActionEnum.back]: "b",
  [MenuActionEnum.closeMenu]: "cm",
};
const actionValueByCode = Object.fromEntries(
  Object.entries(actionCodeByValue).map(([k, v]) => [v, k]),
) as Record<string, MenuActionEnum>;

const fieldConfigList: Array<FieldConfig<MenuCallbackData>> = [
  {
    key: "step",
    shortCode: "s",
    encode: (v) => stepCodeByValue[v as MenuStepEnum],
    decode: (v) => stepValueByCode[v as string],
  },
  {
    key: "action",
    shortCode: "a",
    encode: (v) => actionCodeByValue[v as MenuActionEnum],
    decode: (v) => actionValueByCode[v as string],
  },
  {
    key: "categoryId",
    shortCode: "c",
    encode: (v) => String(v),
    decode: (v) => String(v),
  },
  {
    key: "page",
    shortCode: "p",
    encode: (v) => Number(v),
    decode: (v) => Number(v),
  },
];

const encoder = createCallbackEncoder<MenuCallbackData>(fieldConfigList);

// Использование
const encoded = encoder.encode({
  step: MenuStepEnum.categoryDetail,
  categoryId: "electronics",
  page: 2,
});
// → '{"s":"cd","c":"electronics","p":2}' (компактно, влезет в 64 байта)

const decoded = encoder.decode(encoded);
// → { step: "categoryDetail", categoryId: "electronics", page: 2 }
```

#### Шаг 3: Построй клавиатуры

```typescript
import { createKeyboardBuilder } from "@solncebro/telegram-engine";

const kb = createKeyboardBuilder(encoder);

// Клавиатура главного меню
const mainMenuKeyboard = kb.build([
  {
    text: "⚙️ Настройки",
    callbackData: { step: MenuStepEnum.settings },
  },
  {
    text: "📁 Категории",
    callbackData: { step: MenuStepEnum.selectCategory },
  },
  {
    text: "❌ Закрыть",
    callbackData: { action: MenuActionEnum.closeMenu },
  },
]);

// Клавиатура с навигацией (Back + Main menu)
const categoryKeyboard = kb.build(
  [
    { text: "📦 Электроника", callbackData: { step: MenuStepEnum.categoryDetail, categoryId: "electronics" } },
    { text: "👕 Одежда",     callbackData: { step: MenuStepEnum.categoryDetail, categoryId: "clothes" } },
  ],
  {
    backCallbackData: { step: MenuStepEnum.main },
    mainMenuCallbackData: { step: MenuStepEnum.main },
    backText: "⬅️ Назад",           // опционально, по умолчанию "Back"
    mainMenuText: "🏠 Главное меню", // опционально, по умолчанию "Main menu"
  },
);
```

#### Шаг 4: Опиши навигацию

```typescript
import {
  createNavigationSchema,
  type NavigationStepSchema,
} from "@solncebro/telegram-engine";

const schema: Record<MenuStepEnum, NavigationStepSchema<MenuStepEnum, MenuCallbackData>> = {
  [MenuStepEnum.main]: {
    requiredParamList: [],            // нет обязательных параметров
    backTo: null,                     // некуда возвращаться
    backParamList: [],
  },
  [MenuStepEnum.settings]: {
    requiredParamList: [],
    backTo: MenuStepEnum.main,        // Back → главное меню
    backParamList: [],
  },
  [MenuStepEnum.selectCategory]: {
    requiredParamList: [],
    backTo: MenuStepEnum.main,
    backParamList: [],
  },
  [MenuStepEnum.categoryDetail]: {
    requiredParamList: ["categoryId"], // для этого шага нужен categoryId
    backTo: MenuStepEnum.selectCategory,
    backParamList: [],                 // при Back categoryId не передаётся (возвращаемся к списку)
  },
};

const navigation = createNavigationSchema<MenuStepEnum, MenuCallbackData>(schema);

// Проверка: можно ли отрисовать шаг с такими параметрами?
navigation.validateStepParams(MenuStepEnum.categoryDetail, { categoryId: "electronics" }); // true
navigation.validateStepParams(MenuStepEnum.categoryDetail, {});                             // false

// Куда идти по Back?
navigation.getBackDestination(MenuStepEnum.categoryDetail, { categoryId: "electronics" });
// → { step: "selectCategory", params: {} }
```

#### Шаг 5: Настрой роутеры

```typescript
import { createMenuRouter, createActionRouter } from "@solncebro/telegram-engine";
import { Markup } from "telegraf";

const menuRouter = createMenuRouter<MenuStepEnum, MenuCallbackData>({
  [MenuStepEnum.main]: () => ({
    messageList: ["Главное меню"],
    keyboard: mainMenuKeyboard,
  }),

  [MenuStepEnum.settings]: async () => {
    const settings = await fetchSettings(); // твоя бизнес-логика

    return {
      messageList: [formatSettings(settings)],
      keyboard: settingsKeyboard,
    };
  },

  [MenuStepEnum.selectCategory]: () => ({
    messageList: ["Выберите категорию:"],
    keyboard: categoryKeyboard,
  }),

  [MenuStepEnum.categoryDetail]: async (data) => {
    const category = await fetchCategory(data.categoryId!);

    return {
      messageList: [formatCategory(category)],
      keyboard: categoryDetailKeyboard(data.categoryId!),
    };
  },
});

const actionRouter = createActionRouter<MenuActionEnum, MenuCallbackData>({
  [MenuActionEnum.toggleFeature]: async () => {
    await toggleFeature();

    return {
      messageList: ["Настройка изменена"],
      keyboard: settingsKeyboard,
    };
  },

  [MenuActionEnum.changeValue]: () => ({
    messageList: ["Введите новое значение:"],
    keyboard: inputKeyboard,
  }),

  [MenuActionEnum.back]: () => ({
    messageList: ["Главное меню"],
    keyboard: mainMenuKeyboard,
  }),

  [MenuActionEnum.closeMenu]: () => ({
    messageList: ["Меню закрыто"],
    keyboard: Markup.inlineKeyboard([]),
  }),
});

// Использование в хендлерах
const result = await menuRouter.handleStep(MenuStepEnum.settings, {});
// result.messageList → ["Настройки: ..."]
// result.keyboard → InlineKeyboard

const actionResult = await actionRouter.handleAction(MenuActionEnum.toggleFeature, {});
```

#### Шаг 6: Собери всё в callback_query handler

```typescript
const callbackQueryHandler = async (ctx: Context) => {
  if (!("data" in ctx.callbackQuery!)) return;

  const parsed = encoder.decode(ctx.callbackQuery!.data as string);
  if (!parsed) return;

  try {
    await ctx.answerCbQuery("Обработка...");
  } catch {}

  if (parsed.action) {
    const result = await actionRouter.handleAction(parsed.action, parsed);
    await ctx.editMessageText(result.messageList[0], result.keyboard);

    return;
  }

  if (parsed.step) {
    if (!navigation.validateStepParams(parsed.step, parsed)) {
      const back = navigation.getBackDestination(parsed.step, parsed);
      const fallbackStep = back?.step ?? MenuStepEnum.main;
      const result = await menuRouter.handleStep(fallbackStep, back?.params ?? {});
      await ctx.editMessageText(result.messageList[0], result.keyboard);

      return;
    }

    const result = await menuRouter.handleStep(parsed.step, parsed);
    await ctx.editMessageText(result.messageList[0], result.keyboard);
  }
};
```

---

### 3. Input — Управление вводом пользователя

Когда бот просит пользователя ввести текст (например, новое значение настройки), нужно запомнить что именно он вводит.

#### inputStateManager

```typescript
import { createInputStateManager } from "@solncebro/telegram-engine";

const inputState = createInputStateManager<MenuActionEnum, MenuCallbackData>();

// В callback_query handler — когда пользователь нажал "Изменить значение"
inputState.set(chatId, {
  action: MenuActionEnum.changeValue,
  callbackData: { categoryId: "electronics" },
  messageId: ctx.callbackQuery?.message?.message_id,
});

// В message handler — когда пользователь ввёл текст
if (inputState.has(chatId)) {
  const state = inputState.get(chatId)!;

  if (state.action === MenuActionEnum.changeValue) {
    const newValue = parseFloat(ctx.message.text);
    await saveValue(state.callbackData?.categoryId, newValue);
    await ctx.reply("Значение сохранено!");
    inputState.delete(chatId);
  }
}
```

#### Валидаторы

```typescript
import {
  validatePositiveNumber,
  validateIntegerAndPositive,
  parseCommaSeparatedRange,
} from "@solncebro/telegram-engine";

validatePositiveNumber(5);     // true
validatePositiveNumber(-1);    // false

validateIntegerAndPositive(5);   // { isInteger: true, isPositive: true }
validateIntegerAndPositive(5.5); // { isInteger: false, isPositive: true }

// Парсинг диапазонов "from,to"
parseCommaSeparatedRange("100,200");  // { isValid: true, values: { from: 100, to: 200 } }
parseCommaSeparatedRange("100,");     // { isValid: true, values: { from: 100, to: undefined } }
parseCommaSeparatedRange(",200");     // { isValid: true, values: { from: undefined, to: 200 } }
parseCommaSeparatedRange("-50,50");   // { isValid: true, values: { from: -50, to: 50 } }
parseCommaSeparatedRange("abc,200");  // { isValid: false, errorMessage: "Invalid 'from' value..." }
```

---

### 4. Message — Работа с сообщениями

#### MarkdownV2

Полный набор утилит для безопасного форматирования сообщений в MarkdownV2:

```typescript
import {
  escapeMarkdownV2Text,
  escapeMarkdownV2WithFormatting,
  formatClickableText,
  markdownV2Builder,
} from "@solncebro/telegram-engine";

const price = 1234.56;
const symbol = "BTCUSDT";

// Способ 1: Экранирование + форматирование
const text = `Цена ${formatClickableText(symbol)}: ${escapeMarkdownV2Text(price)} USDT`;
// → "Цена `BTCUSDT`: 1234\.56 USDT"

// Способ 2: Использование markdownV2Builder
const message =
  `Символ: ${markdownV2Builder.code(symbol)}\n` +
  `Цена: ${markdownV2Builder.bold(price)} USDT\n` +
  `Статус: ${markdownV2Builder.italic("актуально")}`;
// → "Символ: `BTCUSDT`\nЦена: *1234\.56* USDT\nСтатус: _актуально_"

// Способ 3: Для сообщений с уже расставленной разметкой
const settingsMessage = "Order Volume: *100 USDT* (was: 50 USDT)";
const escaped = escapeMarkdownV2WithFormatting(settingsMessage);
// → "Order Volume: *100 USDT* \\(was: 50 USDT\\)"
// Bold сохранён, скобки экранированы

await sender.sendMessage({
  message,
  peer: chatId,
  useMarkdownV2: true,
});
```

**Функции:**

- **`escapeMarkdownV2Text(text | number): string`** — Экранирует все 18 спецсимволов: `_ * [ ] ( ) ~ ` > # + - = | { } . !` Используется когда текст не должен содержать форматирование.

- **`escapeMarkdownV2WithFormatting(text): string`** — Умное экранирование. Распознаёт пары маркеров (`*bold*`, `` `code` ``, `||spoiler||`, `_italic_`, `~strikethrough~`) и сохраняет их, экранируя только содержимое. Идеально для сообщений где разметка уже расставлена (например, Firebase settings, отчёты).

- **`formatClickableText(text | number): string`** — Оборачивает в backticks для кликабельного inline code в Telegram: `` `BTCUSDT` ``

- **`markdownV2Builder` объект-builder:**
  - `markdownV2Builder.bold(text)` → `*text*`
  - `markdownV2Builder.italic(text)` → `_text_`
  - `markdownV2Builder.code(text)` → `` `text` ``
  - `markdownV2Builder.strikethrough(text)` → `~text~`
  - `markdownV2Builder.spoiler(text)` → `||text||`
  - `markdownV2Builder.link(text, url)` → `[text](url)`
  - `markdownV2Builder.escape(text)` → экранирование без маркеров

#### Разбиение длинных сообщений

```typescript
import { splitMessageToChunkList } from "@solncebro/telegram-engine";

const longReport = generateReport(); // может быть 10000+ символов

const chunkList = splitMessageToChunkList(longReport);
// chunkList: ["первая часть...", "вторая часть...", ...]

// Разбиение по строкам, не разрывает строки посередине.
// По умолчанию maxLength = 3500 (с запасом от лимита Telegram 4096).
// Можно передать свой лимит:
const smallChunkList = splitMessageToChunkList(longReport, 1000);
```

#### Трекинг сообщений меню

При навигации по inline-меню нужно удалять старые сообщения и редактировать текущее:

```typescript
import { createMessageTracker } from "@solncebro/telegram-engine";

const messageTracker = createMessageTracker();

// Запомнили ID отправленных сообщений меню
messageTracker.set(chatId, [msgId1, msgId2, msgId3]);

// При переходе на новый шаг — получаем список для удаления,
// исключая сообщение которое будем редактировать
const toDeleteList = messageTracker.cleanup(chatId, currentMessageId);
// toDeleteList: [msgId1, msgId3]  (msgId2 == currentMessageId — исключён)

// Удаляем старые
await deleteMessageListById({
  telegram: bot.telegram,
  chatId: numericChatId,
  messageIdList: toDeleteList,
});
```

#### Пакетное удаление

```typescript
import { deleteMessageListById } from "@solncebro/telegram-engine";

await deleteMessageListById({
  telegram: bot.telegram,
  chatId: 123456789,
  messageIdList: [100, 101, 102],
  onLog: (msg, data) => logger.warn(data, msg), // логирует ошибки, не бросает
});
```

Удаляет последовательно. Если одно сообщение не удалось (уже удалено, нет прав) — продолжает со следующим.

---

### 5. Broadcast — Рассылка

#### Broadcaster

```typescript
import { createBroadcaster } from "@solncebro/telegram-engine";

const sender = registry.createSender("Notification")!;

const broadcaster = createBroadcaster({
  sender,
  recipientList: ["111111", "222222", "333333"],
  onLog: (msg, data) => logger.error(data, msg),
});

// Отправить одно сообщение всем
await broadcaster.sendToAll("Сервер перезапущен", true); // true = MarkdownV2

// Отправить длинный отчёт (несколько чанков) всем
const chunkList = splitMessageToChunkList(longReport);
await broadcaster.sendChunkedToAll(chunkList, 300, true);
// 300ms пауза между чанками для одного получателя.
// Получатели обрабатываются параллельно.

// Отправить + закрепить (для дейли-репортов)
const pinnedMessageIdListByChatId = new Map<string, number[]>();

await broadcaster.sendAndPin({
  message: dailyReport,
  pinnedMessageIdListByChatId,    // broadcaster мутирует этот Map
  maxPinnedCount: 10,             // FIFO: если больше 10 — откреплят самый старый
  useMarkdownV2: true,
});
// После вызова pinnedMessageIdListByChatId содержит обновлённые списки
```

#### Reporter — Retry-обёртка

```typescript
import { createReporter } from "@solncebro/telegram-engine";

const reporter = createReporter({ broadcaster });

// Отправить событие. При ошибке — одна повторная попытка.
await reporter.reportEvent("Деплой завершён");
await reporter.reportEvent("Баланс: 1000 USDT", true); // MarkdownV2

// Отправить ошибку
await reporter.reportError("Ошибка подключения к API", error);
```

---

### 6. Command — Регистрация команд

```typescript
import { registerBotCommands } from "@solncebro/telegram-engine";

await registerBotCommands({
  bot: fundingBot.bot,

  // Контроль доступа (опционально)
  accessControl: createAccessControl({ allowedPeerList: ["123"] }),

  // Команды
  commandConfigList: [
    {
      command: "menu",
      description: "Показать меню",
      handler: async (ctx) => {
        const result = await menuRouter.handleStep(MenuStepEnum.main, {});
        await ctx.reply(result.messageList[0], result.keyboard);
      },
    },
    {
      command: "status",
      description: "Статус системы",
      handler: async (ctx) => {
        const status = await getSystemStatus();
        await ctx.reply(status, { parse_mode: "MarkdownV2" });
      },
    },
  ],

  // Обработчик inline-кнопок (опционально)
  callbackQueryHandler: async (ctx) => {
    // Парсинг callback_data, роутинг по шагам/действиям
    // (см. раздел "Menu" выше)
  },

  // Обработчик текстовых сообщений (опционально)
  messageHandler: async (ctx) => {
    // Обработка пользовательского ввода
    // (см. раздел "Input" выше)
  },

  // Логирование ошибок (опционально)
  onError: (msg, data) => logger.error(data, msg),
});
```

`registerBotCommands` выполняет:
1. `setMyCommands` — подсказки в UI Telegram.
2. `bot.command(...)` — для каждой команды с access check + try-catch.
3. `bot.on("callback_query", ...)` — если передан.
4. `bot.on("message", ...)` — если передан.
5. `bot.catch(...)` — catch-all для необработанных ошибок.

---

### 7. Utils

```typescript
import { pause, TELEGRAM_MESSAGE_MAX_LENGTH } from "@solncebro/telegram-engine";

// Пауза
await pause(1000); // 1 секунда

// Константы
TELEGRAM_MESSAGE_MAX_LENGTH; // 3500
```

---

## Полный пример: бот с меню и рассылкой

```typescript
import {
  createBotRegistry,
  createCallbackEncoder,
  createKeyboardBuilder,
  createMenuRouter,
  createNavigationSchema,
  createInputStateManager,
  createBroadcaster,
  createReporter,
  registerBotCommands,
  escapeMarkdownV2Text,
  splitMessageToChunkList,
  type FieldConfig,
  type NavigationStepSchema,
} from "@solncebro/telegram-engine";

// ─── 1. Типы ──────────────────────────────────

enum StepEnum {
  main = "main",
  settings = "settings",
}

enum ActionEnum {
  toggleNotifications = "toggleNotifications",
  close = "close",
}

interface CallbackData {
  step?: StepEnum;
  action?: ActionEnum;
}

// ─── 2. Encoder + Keyboard ────────────────────

const encoder = createCallbackEncoder<CallbackData>([
  { key: "step", shortCode: "s", encode: (v) => String(v), decode: (v) => String(v) as StepEnum },
  { key: "action", shortCode: "a", encode: (v) => String(v), decode: (v) => String(v) as ActionEnum },
]);

const kb = createKeyboardBuilder(encoder);

// ─── 3. Navigation ───────────────────────────

const navigation = createNavigationSchema<StepEnum, CallbackData>({
  [StepEnum.main]: { requiredParamList: [], backTo: null, backParamList: [] },
  [StepEnum.settings]: { requiredParamList: [], backTo: StepEnum.main, backParamList: [] },
});

// ─── 4. Router ────────────────────────────────

let notificationsEnabled = true;

const menuRouter = createMenuRouter<StepEnum, CallbackData>({
  [StepEnum.main]: () => ({
    messageList: ["Главное меню"],
    keyboard: kb.build([
      { text: "⚙️ Настройки", callbackData: { step: StepEnum.settings } },
      { text: "❌ Закрыть", callbackData: { action: ActionEnum.close } },
    ]),
  }),
  [StepEnum.settings]: () => ({
    messageList: [`Уведомления: ${notificationsEnabled ? "ON" : "OFF"}`],
    keyboard: kb.build(
      [{ text: `${notificationsEnabled ? "🔕" : "🔔"} Переключить`, callbackData: { action: ActionEnum.toggleNotifications } }],
      { backCallbackData: { step: StepEnum.main }, mainMenuCallbackData: { step: StepEnum.main } },
    ),
  }),
});

// ─── 5. Registry + Commands ───────────────────

const registry = createBotRegistry({
  allowedPeerList: process.env.ALLOWED_USERS?.split(",") ?? [],
});

const bot = registry.register({
  botToken: process.env.BOT_TOKEN!,
  botName: "Main",
});

await registerBotCommands({
  bot: bot.bot,
  commandConfigList: [
    {
      command: "menu",
      description: "Показать меню",
      handler: async (ctx) => {
        const result = await menuRouter.handleStep(StepEnum.main, {});
        await ctx.reply(result.messageList[0], result.keyboard);
      },
    },
  ],
  callbackQueryHandler: async (ctx) => {
    if (!("data" in ctx.callbackQuery!)) return;

    const parsed = encoder.decode(ctx.callbackQuery!.data as string);
    if (!parsed) return;

    try { await ctx.answerCbQuery(); } catch {}

    if (parsed.action === ActionEnum.toggleNotifications) {
      notificationsEnabled = !notificationsEnabled;
      const result = await menuRouter.handleStep(StepEnum.settings, {});
      await ctx.editMessageText(result.messageList[0], result.keyboard);

      return;
    }

    if (parsed.action === ActionEnum.close) {
      await ctx.deleteMessage();

      return;
    }

    if (parsed.step) {
      const result = await menuRouter.handleStep(parsed.step, parsed);
      await ctx.editMessageText(result.messageList[0], result.keyboard);
    }
  },
  onError: (msg, data) => console.error(msg, data),
});

// ─── 6. Broadcast ─────────────────────────────

const sender = registry.createSender("Main")!;
const broadcaster = createBroadcaster({
  sender,
  recipientList: process.env.ALLOWED_USERS?.split(",") ?? [],
});
const reporter = createReporter({ broadcaster });

// Рассылка по расписанию
setInterval(async () => {
  await reporter.reportEvent(
    `Статус: ${escapeMarkdownV2Text(new Date().toISOString())}`,
    true,
  );
}, 60_000);

// ─── 7. Запуск ────────────────────────────────

await registry.launchAll();
console.log("Bot started");
```

---

## API Reference

### Экспорты

| Функция | Модуль | Описание |
|---------|--------|----------|
| `createBotRegistry` | core | Реестр N ботов с общим access control |
| `createBot` | core | Одиночный Telegraf-инстанс |
| `createSender` | core | Примитивы отправки, привязанные к боту |
| `createAccessControl` | core | Белый список peer ID |
| `createCallbackEncoder` | menu | Кодирование callback_data (64-байтный лимит) |
| `createKeyboardBuilder` | menu | Построение inline-клавиатур |
| `createNavigationSchema` | menu | Граф навигации с валидацией |
| `createMenuRouter` | menu | Роутер шагов меню |
| `createActionRouter` | menu | Роутер действий |
| `createInputStateManager` | input | Состояние ввода пользователя |
| `validatePositiveNumber` | input | Проверка `> 0` |
| `validateIntegerAndPositive` | input | Проверка целое + положительное |
| `parseCommaSeparatedRange` | input | Парсинг `"from,to"` |
| `escapeMarkdownV2Text` | message | Экранирование спецсимволов |
| `escapeMarkdownV2WithFormatting` | message | Экранирование с сохранением разметки |
| `formatClickableText` | message | Оборачивание в backticks |
| `markdownV2Builder` | message | Билдер bold/italic/code/spoiler/link/escape |
| `splitMessageToChunkList` | message | Разбиение по лимиту |
| `createMessageTracker` | message | Трекинг message ID по чатам |
| `deleteMessageListById` | message | Пакетное удаление |
| `createBroadcaster` | broadcast | Рассылка всем получателям |
| `createReporter` | broadcast | Retry-обёртка для рассылки |
| `registerBotCommands` | command | Декларативная регистрация команд |
| `pause` | utils | `setTimeout` в Promise |
| `TELEGRAM_MESSAGE_MAX_LENGTH` | utils | 3500 |
| `DEFAULT_BROADCAST_PAUSE_MS` | utils | 300 |
| `DEFAULT_MAX_PINNED_COUNT` | utils | 10 |
