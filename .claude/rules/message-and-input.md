# Message & Input — Форматирование, трекинг, валидация

## Message (`src/message/`)

### markdownV2.ts — Экранирование MarkdownV2

**`escapeMarkdownV2Text(text: string | number): string`**

Экранирует 18 спецсимволов Telegram MarkdownV2: `_ * [ ] ( ) ~ ` > # + - = | { } . !`

Посимвольная обработка: каждый спецсимвол оборачивается в `\`. Принимает и числа (приводит к строке).

**`escapeMarkdownV2WithFormatting(text: string): string`**

Экранирует текст, сохраняя разметку: распознаёт пары маркеров `` ``` ` `` (code block), `` ` `` (inline code), `||` (spoiler), `*`, `_`, `~` (bold/italic/strikethrough). Внутри пар контент экранируется (кроме code block — остаётся как есть). Вне пар — как `escapeMarkdownV2Text`. Для сообщений с уже расставленным форматированием.

**`formatClickableText(text: string | number): string`**

Оборачивает текст в обратные кавычки для inline code: `` `BTCUSDT` ``. Используется для кликабельного текста в Telegram (пользователь может нажать и скопировать).

**`md`** — объект-билдер для MarkdownV2: `bold`, `italic`, `code`, `strikethrough`, `spoiler`, `link(text, url)`, `escape`. Каждый метод экранирует переданный текст и оборачивает в соответствующие маркеры.

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
