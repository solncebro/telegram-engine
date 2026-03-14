import type { FormattingMarkerItem } from "../types/message.types";

const MARKDOWN_V2_SPECIAL_CHAR_LIST = [
  "_",
  "*",
  "[",
  "]",
  "(",
  ")",
  "~",
  "`",
  ">",
  "#",
  "+",
  "-",
  "=",
  "|",
  "{",
  "}",
  ".",
  "!",
];

const escapeMarkdownV2Text = (text: string | number): string => {
  const characterList = String(text).split("");

  return characterList
    .map((character) =>
      MARKDOWN_V2_SPECIAL_CHAR_LIST.includes(character)
        ? `\\${character}`
        : character,
    )
    .join("");
};

const formatClickableText = (text: string | number): string => `\`${text}\``;

const FORMATTING_MARKER_LIST: FormattingMarkerItem[] = [
  { marker: "```", isCodeBlock: true },
  { marker: "`", isCodeBlock: true },
  { marker: "||", isCodeBlock: false },
  { marker: "*", isCodeBlock: false },
  { marker: "_", isCodeBlock: false },
  { marker: "~", isCodeBlock: false },
];

const escapeMarkdownV2WithFormatting = (text: string): string => {
  let result = "";
  let cursor = 0;

  while (cursor < text.length) {
    let markerFound = false;

    for (const { marker, isCodeBlock } of FORMATTING_MARKER_LIST) {
      if (!text.startsWith(marker, cursor)) {
        continue;
      }

      const contentStart = cursor + marker.length;
      const closingIndex = text.indexOf(marker, contentStart);

      if (closingIndex === -1) {
        break;
      }

      const content = text.slice(contentStart, closingIndex);
      const escapedContent = isCodeBlock ? content : escapeMarkdownV2Text(content);

      result += marker + escapedContent + marker;
      cursor = closingIndex + marker.length;
      markerFound = true;
      break;
    }

    if (!markerFound) {
      const character = text[cursor];

      if (MARKDOWN_V2_SPECIAL_CHAR_LIST.includes(character)) {
        result += `\\${character}`;
      } else {
        result += character;
      }

      cursor++;
    }
  }

  return result;
};

const md = {
  bold: (text: string | number): string => `*${escapeMarkdownV2Text(text)}*`,
  italic: (text: string | number): string => `_${escapeMarkdownV2Text(text)}_`,
  code: (text: string | number): string => `\`${String(text)}\``,
  strikethrough: (text: string | number): string => `~${escapeMarkdownV2Text(text)}~`,
  spoiler: (text: string | number): string => `||${escapeMarkdownV2Text(text)}||`,
  link: (text: string, url: string): string =>
    `[${escapeMarkdownV2Text(text)}](${escapeMarkdownV2Text(url)})`,
  escape: escapeMarkdownV2Text,
};

export {
  escapeMarkdownV2Text,
  escapeMarkdownV2WithFormatting,
  formatClickableText,
  md,
};
