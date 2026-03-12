# Menu Layer — Система inline-меню

`src/menu/` — построение inline-клавиатур, кодирование callback_data, навигация по шагам, роутинг действий.

Все модули параметризованы дженериками — потребитель определяет свои `TStep`, `TAction`, `TData`.

## callbackEncoder.ts — Кодирование callback_data

```
createCallbackEncoder<TData>(fieldConfigList: FieldConfig<TData>[]) → CallbackEncoder<TData>
```

Решает проблему **64-байтного лимита** Telegram на `callback_data`. Потребитель описывает поля и их short-коды:

```typescript
// Пример конфигурации потребителя
const fieldConfigList: FieldConfig<MyData>[] = [
  { key: "step",   shortCode: "s",  encode: v => stepCodeMap[v], decode: v => reverseMap[v] },
  { key: "action", shortCode: "a",  encode: v => String(v),      decode: v => String(v) },
  { key: "page",   shortCode: "p",  encode: v => Number(v),      decode: v => Number(v) },
];
```

**Внутреннее устройство:**
- Хранит два Map: `fieldConfigByShortCode` и `fieldConfigByKey` для O(1) lookup.
- `encode(data)` — обходит переданные поля, пропускает `undefined`, конвертирует через `config.encode()`, возвращает `JSON.stringify()`.
- `decode(raw)` — `JSON.parse()`, обратное преобразование через `config.decode()`. Возвращает `null` при ошибке парсинга или отсутствии известных полей.

## keyboardBuilder.ts — Построение клавиатур

```
createKeyboardBuilder<TData>(encoder: CallbackEncoder<TData>) → KeyboardBuilder<TData>
```

Использует переданный encoder для сериализации callback_data каждой кнопки.

**`build(buttonConfigList, navigationConfig?)`** → `InlineKeyboard`

- `buttonConfigList` — массив `{ text, callbackData: Partial<TData> }`. Каждая кнопка на отдельной строке.
- `navigationConfig` (опциональный) — добавляет строку навигации: "Back" + "Main menu" на одной строке.
  - `backText` / `mainMenuText` — кастомный текст (по умолчанию "Back" / "Main menu").
  - `backCallbackData` / `mainMenuCallbackData` — callback_data для каждой кнопки.

Внутри: `Markup.button.callback(text, encoder.encode(data))` → `Markup.inlineKeyboard([...rows])`.

## navigationSchema.ts — Граф навигации

```
createNavigationSchema<TStep, TData>(
  schema: Record<TStep, NavigationStepSchema<TStep, TData>>
) → NavigationSchema<TStep, TData>
```

Описывает структуру меню декларативно: для каждого шага — какие параметры обязательны и куда вести при нажатии "Back".

**NavigationStepSchema:**
```typescript
{
  requiredParamList: Array<keyof TData>,  // какие поля TData обязательны для этого шага
  backTo: TStep | null,                   // куда вести по Back (null = корень)
  backParamList: Array<keyof TData>,      // какие поля сохранить при навигации назад
}
```

**Методы:**

- `validateStepParams(step, params)` → `boolean` — проверяет что все `requiredParamList` присутствуют в `params`. Используется перед рендерингом шага.
- `getBackDestination(currentStep, currentParams)` → `{ step, params } | null` — вычисляет предыдущий шаг и параметры для него. Из `currentParams` берёт только поля из `backParamList`.

### Пример графа

```
main (нет параметров)
  └─ list (требует categoryId) → back: main
       └─ detail (требует categoryId + itemId) → back: list (сохраняет categoryId)
```

При нажатии Back на `detail { categoryId: "x", itemId: 5 }` → возвращает `{ step: "list", params: { categoryId: "x" } }`.

## menuRouter.ts — Роутер шагов

```
createMenuRouter<TStep, TData>(stepHandlerMap) → MenuRouter<TStep, TData>
```

`stepHandlerMap` — объект `Record<TStep, handler>`, где handler: `(data: Partial<TData>) => MenuStepResult | Promise<MenuStepResult>`.

- `handleStep(step, data)` — вызывает соответствующий handler. Бросает ошибку `"Unknown menu step: ..."` если handler не найден.
- Поддерживает и синхронные, и асинхронные handlers (результат оборачивается в Promise).

## actionRouter.ts — Роутер действий

```
createActionRouter<TAction, TData>(actionHandlerMap) → ActionRouter<TAction, TData>
```

Идентичен menuRouter по структуре, но для действий (toggleModule, changeBaseVolume, etc.).

- `handleAction(action, data)` — вызывает handler. Бросает `"Unknown action: ..."`.

### Разделение menuRouter vs actionRouter

- **menuRouter** — навигационные шаги (показать экран, перейти к подменю). Обычно отображают информацию + клавиатуру.
- **actionRouter** — мутирующие действия (toggle, change value, delete). Обычно изменяют состояние и возвращают обновлённый экран.

### MenuStepResult

```typescript
{
  messageList: string[],     // сообщения для отправки (может быть несколько для длинного контента)
  keyboard: InlineKeyboard,  // Telegraf inline-клавиатура
}
```
