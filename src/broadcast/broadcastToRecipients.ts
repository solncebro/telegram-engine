import type { BroadcastToRecipientsArgs } from "../types/broadcast.types";

const DEFAULT_ERROR_LOG_MESSAGE = "Failed to send to peer";

/**
 * Generic per-recipient fan-out: runs `sendToPeer` for every recipient in parallel,
 * isolating each in its own try/catch so one failing chat never blocks the others.
 * This is the single broadcast mechanism every higher-level helper (createBroadcaster)
 * and consumer (a notifier broadcasting text or photos) reuses — the caller supplies the
 * actual send operation, so it stays agnostic to message kind and parse mode.
 */
const broadcastToRecipients = async ({
  recipientList,
  sendToPeer,
  onLog,
  errorLogMessage = DEFAULT_ERROR_LOG_MESSAGE,
}: BroadcastToRecipientsArgs): Promise<void> => {
  const sendPromiseList = recipientList.map(async (peer) => {
    try {
      await sendToPeer(peer);
    } catch (error) {
      onLog?.(errorLogMessage, {
        peer,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  await Promise.all(sendPromiseList);
};

export { broadcastToRecipients };
