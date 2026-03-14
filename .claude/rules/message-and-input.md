# Message & Input — Форматирование, трекинг, валидация

## Message (`src/message/`)

### markdownV2.ts — Экранирование MarkdownV2

**`escapeMarkdownV2Text(text: string | number): string`**

Экранирует 18 спецсимволов Telegram MarkdownV2: `_ * [ ] ( ) ~ ` > # + - = | { } . !`

Посимвольная обработка: каждый спецсимвол оборачивается в `\`. Принимает и числа (приводит к строке).

**`escapeMarkdownV2WithFormatting(text: string): string`**

Экранирует текст, сохраняя разметку: распознаёт пары маркеров `` ``` `` (code block), `` ` `` (inline code), `||` (spoiler), `*`, `_`, `~` (bold/italic/strikethrough). Внутри пар контент экранируется (кроме code block — остаётся как есть). Вне пар — как `escapeMarkdownV2Text`. Для сообщений с уже расставленным форматированием.

**Примеры:**
```typescript
// Сообщение с bold и скобками
const input = "Order Volume: *100 USDT* (was: 50 USDT)";
escapeMarkdownV2WithFormatting(input);
// → "Order Volume: *100 USDT* \\(was: 50 USDT\\)"
// Bold сохранён, скобки экранированы

// Сообщение с inline code и числами
const systemMsg = "Latest: `2026-03-14 14:30:45`\nTotal: 42";
escapeMarkdownV2WithFormatting(systemMsg);
// → "Latest: `2026-03-14 14:30:45`\nTotal: 42"
// Code block не изменён, число не экранировано

// Смешанное форматирование
const report = "*System State*\nFunding: *0.05%* (24h)\nStatus: `OK`";
escapeMarkdownV2WithFormatting(report);
// → "*System State*\nFunding: *0\\.05%* \\(24h\\)\nStatus: `OK`"
```

**Алгоритм:**
1. Проходит по тексту слева направо.
2. При встрече маркера (открывающего и закрывающего, например `*text*`) — содержимое экранируется посимвольно, но маркеры сохраняются.
3. Для code block'ов (`` ` `` и `` ``` ``) — содержимое остаётся как есть (нет экранирования).
4. Вне маркеров — экранирует все спецсимволы как `escapeMarkdownV2Text`.
5. Если маркер непарный (например, одна `*` посередине) — экранируется как спецсимвол.

**`formatClickableText(text: string | number): string`**

Оборачивает текст в обратные кавычки для inline code: `` `BTCUSDT` ``. Используется для кликабельного текста в Telegram (пользователь может нажать и скопировать).

```typescript
formatClickableText("BTCUSDT");  // → "`BTCUSDT`"
formatClickableText(42);         // → "`42`"
```

**`md`** — объект-билдер для MarkdownV2. Каждый метод экранирует переданный текст и оборачивает в соответствующие маркеры.

**Методы:**

| Метод | Результат | Пример |
|-------|-----------|--------|
| `md.bold(text)` | `*text*` с экранированием | `md.bold("100.5")` → `*100\.5*` |
| `md.italic(text)` | `_text_` с экранированием | `md.italic("note")` → `_note_` |
| `md.code(text)` | `` `text` `` без экранирования | `md.code("BTCUSDT")` → `` `BTCUSDT` `` |
| `md.strikethrough(text)` | `~text~` с экранированием | `md.strikethrough("old")` → `~old~` |
| `md.spoiler(text)` | `\|\|text\|\|` с экранированием | `md.spoiler("hidden")` → `\|\|hidden\|\|` |
| `md.link(text, url)` | `[text](url)` с экранированием обоих | `md.link("click", "http://x.com")` → `[click](http://x\.com)` |
| `md.escape(text)` | Экранирование без маркеров | `md.escape("+125.50")` → `\+125\.50` |

**Примеры использования:**
```typescript
const price = 1234.56;
const symbol = "BTCUSDT";

// Комбинирование bilderа
const message =
  `Символ: ${md.code(symbol)}\n` +
  `Цена: ${md.bold(price)} USDT\n` +
  `Статус: ${md.italic("актуально")}`;
// → "Символ: `BTCUSDT`\nЦена: *1234\.56* USDT\nСтатус: _актуально_"

// С MarkdownV2 парсингом
await sender.sendMessage({
  message,
  peer: chatId,
  useMarkdownV2: true,
});
```

### splitMessage.ts — Разбиение длинных сообщений

**`splitMessageToChunkList(text: string, maxLength?: number): string[]`**

По умолчанию `maxLength = 3500` (константа `TELEGRAM_MESSAGE_MAX_LENGTH`). Telegram-лимит 4096, но оставлен запас.

Алгоритм:
1. Если `text.length <= maxLength` — возвращает `[text]`.
2. Разбивает по `\n`. Накапливает строки в `currentPart`.
3. Если добавление строки превысит лимит — сохраняет `currentPart`, начинает новый.
4. Если **одна строка** превышает лимит — добавляет как отдельный чанк (не разбивает mid-line).
5. Каждый чанк `trimEnd()` — убирает trailing whitespace.

### messageTracker.ts — Трекинг message ID

```
createMessageTracker() → MessageTracker
```

Хранит `Map<string, number[]>` — для каждого chatId список отправленных message_id. Используется для:
- Удаления старых сообщений меню при переходе на новый экран.
- Редактирования существующего сообщения вместо отправки нового.

**Методы:**

| Метод | Поведение |
|-------|-----------|
| `get(chatId)` | Возвращает `number[]`. Если нет — пустой массив `[]`. |
| `set(chatId, messageIdList)` | Перезаписывает список. |
| `delete(chatId)` | Удаляет запись. |
| `cleanup(chatId, excludeMessageId?)` | Удаляет запись из Map и возвращает список. Если передан `excludeMessageId` — исключает его из возвращаемого списка (этот message будет отредактирован, а не удалён). |

### deleteMessageList.ts — Пакетное удаление

```
deleteMessageListById({ telegram, chatId, messageIdList, onLog? }) → Promise<void>
```

Последовательно удаляет сообщения по ID. **Не бросает исключений** — ловит ошибку на каждом сообщении и логирует через `onLog`. Продолжает удаление даже если одно сообщение не удалось (уже удалено, нет прав и т.д.).

Принимает `Telegram` instance напрямую (не sender) — низкоуровневый примитив.

---

## Input (`src/input/`)

### inputStateManager.ts — Состояние ввода

```
createInputStateManager<TAction, TData>() → InputStateManager<TAction, TData>
```

Хранит `Map<string, InputState>` — для каждого chatId текущее состояние ввода пользователя.

`InputState`:
```typescript
{
  action: TAction,              // какое действие ожидает ввод (changeScore, createFilterRange, ...)
  callbackData?: Partial<TData>, // контекст: periodHours, rangeIndex, etc.
  messageId?: number,            // ID сообщения-подсказки для последующего редактирования
}
```

**Методы:** `get(chatId)`, `set(chatId, state)`, `delete(chatId)`, `has(chatId)`.

Типичный flow:
1. Пользователь нажимает кнопку "Change score" → `actionRouter` возвращает prompt.
2. Потребитель вызывает `inputState.set(chatId, { action: "changeScore", callbackData: { periodHours, rangeIndex } })`.
3. Следующее текстовое сообщение от пользователя → потребитель проверяет `inputState.has(chatId)`, получает state, обрабатывает ввод.
4. При успехе → `inputState.delete(chatId)`.

### inputValidator.ts — Валидаторы

**`validatePositiveNumber(value: number): boolean`** — `value > 0`.

**`validateIntegerAndPositive(value: number): ValidateIntegerAndPositiveResult`** — возвращает `{ isInteger: boolean, isPositive: boolean }`.

**`parseCommaSeparatedRange(text: string): ParseCommaSeparatedRangeResult`**

Парсит формат `"from,to"` для диапазонов фильтров.

Поддерживает:
- `"100,200"` → `{ from: 100, to: 200 }`
- `"100,"` → `{ from: 100, to: undefined }` (от 100 и выше)
- `",200"` → `{ from: undefined, to: 200 }` (до 200)
- `"-50,50"` → `{ from: -50, to: 50 }` (отрицательные значения)

Ошибки:
- Не 2 части → `"Invalid format..."`
- NaN значение → `"Invalid 'from'/'to' value..."`
- Обе части пусты → `"At least one value must be specified."`
