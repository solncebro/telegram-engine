import { TELEGRAM_MESSAGE_MAX_LENGTH } from "../utils/constants";

const splitMessageToChunkList = (
  text: string,
  maxLength: number = TELEGRAM_MESSAGE_MAX_LENGTH,
): string[] => {
  if (text.length <= maxLength) {
    return [text];
  }

  const partList: string[] = [];
  const lineList = text.split("\n");
  let currentPart = "";

  for (const line of lineList) {
    const lineWithNewline = line + "\n";

    if (currentPart.length + lineWithNewline.length > maxLength) {
      if (currentPart.length > 0) {
        partList.push(currentPart.trimEnd());
        currentPart = "";
      }

      if (lineWithNewline.length > maxLength) {
        partList.push(line);
      } else {
        currentPart = lineWithNewline;
      }
    } else {
      currentPart += lineWithNewline;
    }
  }

  if (currentPart.length > 0) {
    partList.push(currentPart.trimEnd());
  }

  return partList;
};

export { splitMessageToChunkList };
