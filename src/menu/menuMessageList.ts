import type { BuildMessageIdListToDeleteArgs } from "../types/menu.types";

function buildMessageIdListToDelete(
  args: BuildMessageIdListToDeleteArgs,
): number[] {
  const { trackedIdList, callbackMessageId } = args;
  const result = [...trackedIdList];

  if (callbackMessageId === undefined) {
    return result;
  }

  if (result.includes(callbackMessageId)) {
    return result;
  }

  result.push(callbackMessageId);

  return result;
}

export { buildMessageIdListToDelete };
