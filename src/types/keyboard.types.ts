interface RawInlineButton {
  text: string;
  callback_data: string;
}

interface RawInlineKeyboardMarkup {
  inline_keyboard: RawInlineButton[][];
}

export type { RawInlineButton, RawInlineKeyboardMarkup };
