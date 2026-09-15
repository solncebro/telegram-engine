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
createKeyboardBuilder<TData>(encoder: CallbackEncoder<TData>, defaultLayout?: KeyboardLayout) → KeyboardBuilder<TData>
```

Использует переданный encoder для сериализации callback_data каждой кнопки. `defaultLayout` (`{ columnCount }`, 0.5.0) — сколько кнопок в ряду по умолчанию у ВСЕХ клавиатур этого сборщика; без него — одна кнопка в ряду, как раньше.

**`build(buttonConfigList, navigationConfig?, layout?)`** → `InlineKeyboard`

- `buttonConfigList` — плоский массив `{ text, callbackData: Partial<TData> }`; режется на ряды по `columnCount` (из `layout` вызова, иначе из `defaultLayout` сборщика, иначе 1).
- `navigationConfig` (опциональный) — добавляет ПОСЛЕДНЮЮ строку навигации: "Back" + "Main menu" на одной строке, при любой раскладке.
  - `backText` / `mainMenuText` — кастомный текст (по умолчанию "Back" / "Main menu").
  - `backCallbackData` / `mainMenuCallbackData` — callback_data для каждой кнопки.
- `layout` (опциональный) — переопределить число колонок для одной клавиатуры.

**`buildRows(rowList, navigationConfig?)`** → `InlineKeyboard` (0.5.0)

Ряды ровно такие, как передал вызывающий, — для клавиатур, у которых форма значима (заглавная кнопка одна сверху, фиксированная пара внизу). Тот же encoder, та же строка навигации последней. Повод: боты собирали такие клавиатуры руками поверх encoder'а, обходя сборщик.

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

## menuTree.ts — Дерево экранов

```
createMenuTree<TScreen>({ parentByScreen, resolveParent?, footerLabels? }) → MenuTree<TScreen>
```

Обёртка над `createNavigationSchema` для flat-дерева экранов без параметров шага.

- `parentByScreen` — `Record<TScreen, TScreen | null>`: статический родитель каждого экрана.
- `resolveParent?(screen, staticParent)` — опциональный динамический resolver поверх статического.
- `getParent(screen)` → `TScreen | null`.
- `buildFooterRow(screen, onClose)` → `RawInlineButton[]` — стандартный ряд `[Back][Close]`.

## menuReplacer.ts — Жизненный цикл сообщений меню

```
createMenuReplacer({ resolveSurface, onLog? }) → MenuReplacer
```

Управляет появлением, заменой и закрытием inline-меню.

- `resolveSurface(ctx)` → `MenuSurface` (`chatId`, `telegram`, `trackedMessageIdList`).
- `replaceMenu(ctx, args)` — заменить экран или закрыть (`shouldCloseOnly`). Удаляет tracked + callback message, отправляет новое.
- Безвредные ошибки edit/delete игнорируются через `isBenignTelegramEditError`.

## loadingController.ts — Индикатор загрузки

```
createLoadingController({ menuReplacer, onLog? }) → LoadingController
```

- `startCallbackLoading(ctx, loadingText)` → `LoadingHandle` — показывает loading-сообщение, возвращает handle.
- `LoadingHandle.finalize(text)` — заменяет loading на финальный текст.
- `startReplyLoading(ctx, loadingText)` — аналог для reply-кнопок.

## dismissKeyboard.ts — Снятие клавиатуры

- `buildDismissReplyMarkup({ closeText? })` → `RawInlineKeyboardMarkup` — одна кнопка «Закрыть».
- `dismissKeyboard(ctx)` — убирает inline-клавиатуру, текст сообщения остаётся.

## wizard.ts — Многошаговые сессии

```
createWizard<TState>() → Wizard<TState>
```

Хранит шаг + накопленные данные по ключу (например, chatId). Приложение определяет shape `TState` и переходы.

- `start(key, state)` / `get(key)` / `patch(key, partial)` / `reset(key)` / `isActive(key)`.

## presetKeyboard.ts / recentList.ts / menuMessageList.ts — Вспомогательные утилиты

- `buildPresetKeyboard({ valueList, ... })` — ряд кнопок-заготовок из списка значений.
- `buildPresetDisplayList({ recentList, defaultList, maxCount })` — слияние «недавние + дефолты» без дублей.
- `promoteToFront(list, value, maxCount)` — продвигает значение в начало истории.
- `buildMessageIdListToDelete({ trackedIdList, callbackMessageId? })` — список ID для удаления при замене экрана.
