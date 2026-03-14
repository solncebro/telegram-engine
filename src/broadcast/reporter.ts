import type { CreateReporterArgs, Reporter } from "../types/broadcast.types";

const createReporter = ({ broadcaster }: CreateReporterArgs): Reporter => {
  const sendWithRetry = async (
    message: string,
    useMarkdownV2?: boolean,
  ): Promise<void> => {
    try {
      await broadcaster.sendToAll(message, useMarkdownV2);
    } catch {
      try {
        await broadcaster.sendToAll(`${message} (retry)`, useMarkdownV2);
      } catch {}
    }
  };

  const reportEvent = async (
    message: string,
    useMarkdownV2 = false,
  ): Promise<void> => {
    await sendWithRetry(message, useMarkdownV2);
  };

  const reportError = async (
    message: string,
    _error: unknown,
  ): Promise<void> => {
    await sendWithRetry(message);
  };

  return { reportEvent, reportError };
};

export { createReporter };
