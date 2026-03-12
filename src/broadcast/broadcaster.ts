import type { CreateBroadcasterArgs, SendAndPinArgs, Broadcaster } from "../types/broadcast.types";
import { DEFAULT_BROADCAST_PAUSE_MS } from "../utils/constants";
import { pause } from "../utils/pause";

const createBroadcaster = ({
  sender,
  recipientList,
  onLog,
}: CreateBroadcasterArgs): Broadcaster => {
  const sendToAll = async (
    message: string,
    useMarkdownV2 = false,
  ): Promise<void> => {
    const sendPromiseList = recipientList.map(async (peer) => {
      try {
        await sender.sendMessage({ message, peer, useMarkdownV2 });
      } catch (error) {
        onLog?.("Failed to send message to peer", {
          peer,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(sendPromiseList);
  };

  const sendChunkedToAll = async (
    messageList: string[],
    pauseDuration: number = DEFAULT_BROADCAST_PAUSE_MS,
    useMarkdownV2 = false,
  ): Promise<void> => {
    const sendPromiseList = recipientList.map(async (peer) => {
      for (let i = 0; i < messageList.length; i++) {
        const message = messageList[i];

        try {
          await sender.sendMessage({ message, peer, useMarkdownV2 });

          if (i < messageList.length - 1) {
            await pause(pauseDuration);
          }
        } catch (error) {
          onLog?.("Failed to send message part to peer", {
            peer,
            messageIndex: i,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    await Promise.all(sendPromiseList);
  };

  const sendAndPin = async ({
    message,
    pinnedMessageIdListByChatId,
    maxPinnedCount = 10,
    useMarkdownV2 = false,
  }: SendAndPinArgs): Promise<void> => {
    const sendPromiseList = recipientList.map(async (peer) => {
      try {
        const sendResult = await sender.sendMessage({
          message,
          peer,
          returnMessageId: true,
          useMarkdownV2,
        });

        if (!sendResult) {
          return;
        }

        const list = pinnedMessageIdListByChatId.get(peer) ?? [];

        if (list.length >= maxPinnedCount) {
          await sender.unpinMessage(peer, list[0]).catch(() => undefined);
        }

        await sender.pinMessage(peer, sendResult);

        const newList =
          list.length >= maxPinnedCount
            ? [...list.slice(1), sendResult]
            : [...list, sendResult];

        pinnedMessageIdListByChatId.set(peer, newList);
      } catch (error) {
        onLog?.("Failed to send and pin message", {
          peer,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(sendPromiseList);
  };

  return { sendToAll, sendChunkedToAll, sendAndPin };
};

export { createBroadcaster };
