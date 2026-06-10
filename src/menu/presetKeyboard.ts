import type { RawInlineButton } from "../types/keyboard.types";
import type { BuildPresetKeyboardArgs } from "../types/menu.types";

function buildPresetKeyboard<T extends number | string>({
  valueList,
  callbackPrefix,
  formatText,
  maxCount,
}: BuildPresetKeyboardArgs<T>): RawInlineButton[][] {
  const displayList =
    maxCount === undefined ? valueList : valueList.slice(0, maxCount);

  return [
    displayList.map((value) => ({
      text: formatText(value),
      callback_data: `${callbackPrefix}:${value}`,
    })),
  ];
}

export { buildPresetKeyboard };
