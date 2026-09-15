import { Markup } from "telegraf";
import type {
  CallbackEncoder,
  ButtonConfig,
  NavigationButtonConfig,
  KeyboardBuilder,
  KeyboardLayout,
  InlineKeyboard,
} from "../types/menu.types";

/** One button per row — the layout every bot got before columns existed (0.5.0). */
const DEFAULT_COLUMN_COUNT = 1;

const createKeyboardBuilder = <TData>(
  encoder: CallbackEncoder<TData>,
  defaultLayout?: KeyboardLayout,
): KeyboardBuilder<TData> => {
  const createCallbackButton = (text: string, callbackData: Partial<TData>) =>
    Markup.button.callback(text, encoder.encode(callbackData));

  const buildRowList = (rowList: Array<Array<ButtonConfig<TData>>>) =>
    rowList.map((row) =>
      row.map((config) => createCallbackButton(config.text, config.callbackData)),
    );

  const buildNavigationRow = (navigationConfig: NavigationButtonConfig<TData>) => [
    createCallbackButton(
      navigationConfig.backText ?? "Back",
      navigationConfig.backCallbackData,
    ),
    createCallbackButton(
      navigationConfig.mainMenuText ?? "Main menu",
      navigationConfig.mainMenuCallbackData,
    ),
  ];

  const buildRows = (
    rowList: Array<Array<ButtonConfig<TData>>>,
    navigationConfig?: NavigationButtonConfig<TData>,
  ): InlineKeyboard => {
    const buttonRowList = buildRowList(rowList);

    if (!navigationConfig) {
      return Markup.inlineKeyboard(buttonRowList);
    }

    return Markup.inlineKeyboard([...buttonRowList, buildNavigationRow(navigationConfig)]);
  };

  const build = (
    buttonConfigList: Array<ButtonConfig<TData>>,
    navigationConfig?: NavigationButtonConfig<TData>,
    layout?: KeyboardLayout,
  ): InlineKeyboard => {
    const columnCount = Math.max(
      1,
      Math.floor(layout?.columnCount ?? defaultLayout?.columnCount ?? DEFAULT_COLUMN_COUNT),
    );
    const rowList: Array<Array<ButtonConfig<TData>>> = [];

    for (let index = 0; index < buttonConfigList.length; index += columnCount) {
      rowList.push(buttonConfigList.slice(index, index + columnCount));
    }

    return buildRows(rowList, navigationConfig);
  };

  return { build, buildRows };
};

export { createKeyboardBuilder };
