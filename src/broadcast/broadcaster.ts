import type {
  CreateBroadcasterArgs,
  SendAndPinArgs,
  Broadcaster,
  BroadcastExtra,
} from "../types/broadcast.types";
import { DEFAULT_BROADCAST_PAUSE_MS, DEFAULT_MAX_PINNED_COUNT } from "../utils/constants";
import { pause } from "../utils/pause";
import { broadcastToRecipients } from "./broadcastToRecipients";

const createBroadcaster = ({
  sender,
  recipientList,
  onLog,
}: CreateBroadcasterArgs): Broadcaster => {
  const sendToAll = async (
    message: string,
    useMarkdownV2 = false,
    extra?: BroadcastExtra,
  ): Promise<void> => {
    await broadcastToRecipients({
      recipientList,
      sendToPeer: async (peer) => {
        await sender.sendMessage({
          message,
          peer,
          useMarkdownV2,
          // Omit the key entirely rather than sending it as `undefined` — the
          // call shape without a keyboard must stay byte-identical to the one
          // before `extra` existed (review round 1 found the previous
          // unconditional key made the "no keyboard" test unable to tell the
          // difference, KATUSDT 09.09.2026).
          ...(extra?.replyMarkup !== undefined && { replyMarkup: extra.replyMarkup }),
        });
      },
      onLog,
      errorLogMessage: "Failed to send message to peer",
    });
  };

  const sendChunkedToAll = async (
    messageList: string[],
    pauseDuration: number = DEFAULT_BROADCAST_PAUSE_MS,
    useMarkdownV2 = false,
  ): Promise<void> => {
    await broadcastToRecipients({
      recipientList,
      // Per-message try/catch keeps messageIndex context and lets a peer continue past a
      // single failed chunk; the fan-out primitive only parallelizes across recipients.
      sendToPeer: async (peer) => {
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
      },
      onLog,
    });
  };

  const sendAndPin = async ({
    message,
    pinnedMessageIdListByChatId,
    maxPinnedCount = DEFAULT_MAX_PINNED_COUNT,
    useMarkdownV2 = false,
  }: SendAndPinArgs): Promise<void> => {
    await broadcastToRecipients({
      recipientList,
      sendToPeer: async (peer) => {
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
      },
      onLog,
      errorLogMessage: "Failed to send and pin message",
    });
  };

  return { sendToAll, sendChunkedToAll, sendAndPin };
};

export { createBroadcaster };
