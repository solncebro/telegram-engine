import type { Context, Telegram } from "telegraf";

import type { MessageTracker } from "./message.types";
import type { RawInlineKeyboardMarkup } from "./keyboard.types";

interface MenuSurface {
  telegram: Telegram;
  chatId: string;
  tracker: MessageTracker;
}

type MenuLogLevel = "warn" | "error";

type MenuLogFunction = (
  level: MenuLogLevel,
  message: string,
  meta?: Record<string, unknown>,
) => void;

type ResolveSurface = (ctx: Context | null) => MenuSurface | null;

type ReplaceMenuArgs =
  | { shouldCloseOnly: true }
  | {
      shouldCloseOnly?: false;
      text: string;
      replyMarkup?: RawInlineKeyboardMarkup;
      extra?: Record<string, unknown>;
      isPlainText?: boolean;
      chartFileIdList?: string[];
      onChartMessagesUpdated?: (newChartIdList: number[]) => void;
    };

interface CreateMenuReplacerArgs {
  resolveSurface: ResolveSurface;
  onLog?: MenuLogFunction;
}

interface MenuReplacer {
  replaceMenu: (
    ctx: Context | null,
    args: ReplaceMenuArgs,
  ) => Promise<number | null>;
  sendMenuResult: (
    ctx: Context,
    text: string,
    extra?: Record<string, unknown>,
  ) => Promise<number>;
  deleteTrackedMessages: (
    ctx: Context | null,
    excludeMessageId?: number,
  ) => Promise<void>;
}

type LoadingMode = "replace-text" | "strip-keyboard";

interface LoadingHandle {
  finalize: (
    text: string,
    extra?: Record<string, unknown>,
  ) => Promise<number | null>;
  fail: (errorText: string, extra?: Record<string, unknown>) => Promise<void>;
  clear: () => Promise<void>;
}

interface CreateLoadingControllerArgs {
  menuReplacer: MenuReplacer;
  resolveSurface: ResolveSurface;
  defaultLoadingText: string;
  onLog?: MenuLogFunction;
}

interface LoadingController {
  startCallbackLoading: (
    ctx: Context,
    mode: LoadingMode,
    loadingText?: string,
  ) => Promise<LoadingHandle>;
  startHearsLoading: (ctx: Context, loadingText?: string) => Promise<LoadingHandle>;
}

interface BuildDismissReplyMarkupArgs {
  text: string;
  callbackData?: string;
}

export type {
  MenuSurface,
  MenuLogLevel,
  MenuLogFunction,
  ResolveSurface,
  ReplaceMenuArgs,
  CreateMenuReplacerArgs,
  MenuReplacer,
  LoadingMode,
  LoadingHandle,
  CreateLoadingControllerArgs,
  LoadingController,
  BuildDismissReplyMarkupArgs,
};
