# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Команды

```bash
yarn build              # Lint + компиляция TypeScript → dist/
yarn build:watch        # Компиляция в watch-режиме
yarn type-check         # Проверка типов (без emit)
yarn test               # Запустить все Jest-тесты
yarn test -- --testPathPattern=sender  # Запустить тесты по паттерну
yarn test:watch         # Тесты в watch-режиме
yarn test:coverage      # Тесты с отчётом по покрытию
yarn lint               # ESLint src/ test/
```

Последовательность верификации: `yarn type-check && yarn test && yarn build`

## Архитектура

`@solncebro/telegram-engine` — универсальная TypeScript-библиотека для Telegram ботов на базе Telegraf v4.16.3. Извлечена из `kliner-autotrade-funding` — все модули domain-agnostic, потребитель определяет свои enum'ы, типы и обработчики через дженерики и фабрики.

Единственная runtime-зависимость: `telegraf`. Нет привязки к логгеру, `process.env` или доменной логике.

### Слои и поток данных

```
Потребитель
  │
  ▼
src/index.ts (barrel exports — единственная точка входа)
  │
  ├─ core/     Жизненный цикл ботов, отправка, контроль доступа
  ├─ menu/     Inline-меню: кодирование callback_data, клавиатуры, роутинг
  ├─ input/    Управление вводом: состояние + валидация
  ├─ message/  Форматирование, разбиение, трекинг, удаление сообщений
  ├─ broadcast/ Рассылка всем пользователям, retry-логика
  ├─ command/  Декларативная регистрация команд бота
  └─ utils/    pause(), константы
```

### Ключевые архитектурные принципы

- **Функциональные фабрики** — `createX(args) → Interface`. Не классы. Состояние инкапсулировано в замыкании.
- **onLog callback** — логирование инжектируется потребителем, нет зависимости от конкретного логгера.
- **Нет process.env** — всё передаётся через конфиг явно.
- **Дженерики в menu/** — потребитель определяет свои `TStep`, `TAction`, `TData` enum'ы и типы.
- **Типы изолированы** — `src/types/*.types.ts`. Inline-типы в implementation-файлах запрещены.
- **Barrel export** — единственная точка входа `src/index.ts`, все публичные API экспортируются оттуда.

## Детальная документация

Подробные описания модулей, типов, тестирования и графа зависимостей находятся в `.claude/rules/`:

| Файл | Содержание |
|------|-----------|
| [core-layer.md](.claude/rules/core-layer.md) | createBot, botRegistry, sender, accessControl — жизненный цикл ботов |
| [menu-layer.md](.claude/rules/menu-layer.md) | callbackEncoder, keyboardBuilder, navigationSchema, menuRouter, actionRouter |
| [message-and-input.md](.claude/rules/message-and-input.md) | escapeMarkdownV2Text, escapeMarkdownV2WithFormatting, formatClickableText, markdownV2Builder, splitMessage, messageTracker, deleteMessageList, inputStateManager, inputValidator |
| [broadcast-and-command.md](.claude/rules/broadcast-and-command.md) | broadcaster, reporter, commandRegistrar |
| [types-and-dependencies.md](.claude/rules/types-and-dependencies.md) | Все типы, граф зависимостей между модулями |
| [testing-patterns.md](.claude/rules/testing-patterns.md) | Мокирование Telegraf, структура тестов, паттерны |

## Стиль кода

Во время разработки **обязательно** опирайся на скилл `code-style` — он содержит все правила форматирования, именования, типизации и структуры кода. Применяй его при написании, редактировании и ревью любого кода.

После завершения любой задачи (фича, багфикс, рефакторинг) **обязательно** запусти агент `code-style-enforcer` для проверки всех изменённых файлов на соответствие стилю кода.

### Message модуль — дополнительно

При работе с `src/message/markdownV2.ts`:
- `escapeMarkdownV2Text` — базовое экранирование, используется в `markdownV2Builder.*` методах и как fallback в `escapeMarkdownV2WithFormatting`
- `escapeMarkdownV2WithFormatting` — умное экранирование, требует точности в распознавании маркеров. Тесты включают реальные паттерны из `kliner-autotrade-funding`
- `markdownV2Builder` объект — чистые функции без побочных эффектов, каждый метод изолирован и тестируется отдельно
- Константа `FORMATTING_MARKER_LIST` — порядок маркеров критичен (`` ``` `` проверяется раньше `` ` ``)
