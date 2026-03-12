import { Markup } from "telegraf";
import type {
  CallbackEncoder,
  ButtonConfig,
  NavigationButtonConfig,
  KeyboardBuilder,
  InlineKeyboard,
} from "../types/menu.types";

const createKeyboardBuilder = <TData>(
  encoder: CallbackEncoder<TData>,
): KeyboardBuilder<TData> => {
  const createCallbackButton = (text: string, callbackData: Partial<TData>) =>
    Markup.button.callback(text, encoder.encode(callbackData));

  const build = (
    buttonConfigList: Array<ButtonConfig<TData>>,
    navigationConfig?: NavigationButtonConfig<TData>,
  ): InlineKeyboard => {
    const buttonList = buttonConfigList.map((config) => [
      createCallbackButton(config.text, config.callbackData),
    ]);

    if (!navigationConfig) {
      return Markup.inlineKeyboard(buttonList);
    }

    const navigationButtonList = [
      createCallbackButton(
        navigationConfig.backText ?? "Back",
        navigationConfig.backCallbackData,
      ),
      createCallbackButton(
        navigationConfig.mainMenuText ?? "Main menu",
        navigationConfig.mainMenuCallbackData,
      ),
    ];

    return Markup.inlineKeyboard([...buttonList, navigationButtonList]);
  };

  return { build };
};

export { createKeyboardBuilder };
