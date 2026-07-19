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
        partList.push(line.trimEnd());
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

const TELEGRAM_MESSAGE_SPLIT_LIMIT = 3500;

const splitOversizedBlock = (block: string, limit: number): string[] => {
  const partList: string[] = [];
  let current = "";

  const lineList = block.split("\n");

  for (const line of lineList) {
    const candidate = current.length === 0 ? line : `${current}\n${line}`;

    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      partList.push(current);
      current = "";
    }

    if (line.length > limit) {
      partList.push(line);
      continue;
    }

    current = line;
  }

  if (current.length > 0) {
    partList.push(current);
  }

  return partList;
};

const splitMessageByBoundary = (message: string, limit: number): string[] => {
  if (message.length <= limit) {
    return [message];
  }

  const partList: string[] = [];
  let current = "";

  const blockList = message.split("\n\n");

  for (const block of blockList) {
    const candidate = current.length === 0 ? block : `${current}\n\n${block}`;

    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      partList.push(current);
      current = "";
    }

    if (block.length <= limit) {
      current = block;
      continue;
    }

    const subPartList = splitOversizedBlock(block, limit);

    for (let i = 0; i < subPartList.length - 1; i += 1) {
      partList.push(subPartList[i]);
    }

    current = subPartList[subPartList.length - 1] ?? "";
  }

  if (current.length > 0) {
    partList.push(current);
  }

  return partList;
};

interface SendSplitMessageArgs {
  sender: (chunk: string, index: number) => Promise<unknown>;
  message: string;
  limit?: number;
}

const sendSplitMessage = async (args: SendSplitMessageArgs): Promise<void> => {
  const limit = args.limit ?? TELEGRAM_MESSAGE_SPLIT_LIMIT;
  const partList = splitMessageByBoundary(args.message, limit);

  for (let i = 0; i < partList.length; i += 1) {
    await args.sender(partList[i], i);
  }
};

export { splitMessageToChunkList, splitMessageByBoundary, sendSplitMessage, TELEGRAM_MESSAGE_SPLIT_LIMIT };
export type { SendSplitMessageArgs };
