import { Context, Telegraf } from "telegraf";

interface BotCrashGuardArgs {
  onError?: (error: unknown, update: Context["update"]) => void;
}

// Prevents a single failing handler from permanently killing the bot's long polling.
//
// Telegraf's DEFAULT error handler re-throws the error (telegraf handleError → `throw err`). That
// rejects `handleUpdate`, which makes the polling loop's `Promise.all(updates.map(handleUpdate))`
// reject and hit its `finally` block → `abortController.abort()` → polling stops FOREVER. One bad
// handler thus takes the whole bot offline until the process is restarted.
//
// Registering a `bot.catch` that logs (via `onError`) and never re-throws keeps the error local to
// the failing update: polling stays alive and every other button keeps working.
const applyBotCrashGuard = (
  bot: Telegraf,
  { onError }: BotCrashGuardArgs = {},
): void => {
  bot.catch((error: unknown, ctx: Context) => {
    onError?.(error, ctx.update);
  });
};

export { applyBotCrashGuard };
export type { BotCrashGuardArgs };
