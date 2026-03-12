import type { CreateReporterArgs, Reporter } from "../types/broadcast.types";

const createReporter = ({ broadcaster }: CreateReporterArgs): Reporter => {
  const reportEvent = async (
    message: string,
    useMarkdownV2 = false,
  ): Promise<void> => {
    try {
      await broadcaster.sendToAll(message, useMarkdownV2);
    } catch {
      try {
        await broadcaster.sendToAll(`${message} (retry)`, useMarkdownV2);
      } catch {}
    }
  };

  const reportError = async (
    message: string,
    _error: unknown,
  ): Promise<void> => {
    try {
      await broadcaster.sendToAll(message);
    } catch {
      try {
        await broadcaster.sendToAll(`${message} (retry)`);
      } catch {}
    }
  };

  return { reportEvent, reportError };
};

export { createReporter };
