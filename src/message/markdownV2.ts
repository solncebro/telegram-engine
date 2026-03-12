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

export { escapeMarkdownV2Text, formatClickableText };
