import type {
  CreateReporterArgs,
  Reporter,
  BroadcastExtra,
} from "../types/broadcast.types";

const createReporter = ({ broadcaster }: CreateReporterArgs): Reporter => {
  // Call sendToAll with exactly as many positional arguments as the caller
  // gave: an explicit trailing `undefined` extra is a THIRD argument, not
  // "no argument", and would break every existing arity-2 assertion on the
  // mocked broadcaster (KATUSDT 09.09.2026).
  const forwardToAll = (
    message: string,
    useMarkdownV2?: boolean,
    extra?: BroadcastExtra,
  ): Promise<void> =>
    extra !== undefined
      ? broadcaster.sendToAll(message, useMarkdownV2, extra)
      : broadcaster.sendToAll(message, useMarkdownV2);

  const sendWithRetry = async (
    message: string,
    useMarkdownV2?: boolean,
    extra?: BroadcastExtra,
  ): Promise<void> => {
    try {
      await forwardToAll(message, useMarkdownV2, extra);
    } catch {
      try {
        await forwardToAll(`${message} (retry)`, useMarkdownV2, extra);
      } catch {}
    }
  };

  const reportEvent = async (
    message: string,
    useMarkdownV2 = false,
    extra?: BroadcastExtra,
  ): Promise<void> => {
    await sendWithRetry(message, useMarkdownV2, extra);
  };

  const reportError = async (
    message: string,
    _error: unknown,
    extra?: BroadcastExtra,
  ): Promise<void> => {
    await sendWithRetry(message, undefined, extra);
  };

  return { reportEvent, reportError };
};

export { createReporter };
