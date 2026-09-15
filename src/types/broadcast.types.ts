import { TelegramSender, LogFunction } from "./bot.types";
import type { RawInlineKeyboardMarkup } from "./keyboard.types";

interface BroadcastToRecipientsArgs {
  recipientList: string[];
  sendToPeer: (peer: string) => Promise<void>;
  onLog?: LogFunction;
  errorLogMessage?: string;
}

interface CreateBroadcasterArgs {
  sender: TelegramSender;
  recipientList: string[];
  onLog?: LogFunction;
}

// rubber needs an inline "retry entry" button under a broadcast rejection
// alert (KATUSDT 09.09.2026); reuses the sender's own keyboard type instead
// of inventing a second one.
interface BroadcastExtra {
  replyMarkup?: RawInlineKeyboardMarkup;
}

interface SendAndPinArgs {
  message: string;
  pinnedMessageIdListByChatId: Map<string, number[]>;
  maxPinnedCount?: number;
  useMarkdownV2?: boolean;
}

interface Broadcaster {
  sendToAll: (
    message: string,
    useMarkdownV2?: boolean,
    extra?: BroadcastExtra,
  ) => Promise<void>;
  sendChunkedToAll: (
    messageList: string[],
    pauseDuration?: number,
    useMarkdownV2?: boolean,
  ) => Promise<void>;
  sendAndPin: (args: SendAndPinArgs) => Promise<void>;
}

interface CreateReporterArgs {
  broadcaster: Broadcaster;
}

interface Reporter {
  reportEvent: (
    message: string,
    useMarkdownV2?: boolean,
    extra?: BroadcastExtra,
  ) => Promise<void>;
  reportError: (
    message: string,
    error: unknown,
    extra?: BroadcastExtra,
  ) => Promise<void>;
}

export type {
  BroadcastToRecipientsArgs,
  CreateBroadcasterArgs,
  BroadcastExtra,
  SendAndPinArgs,
  Broadcaster,
  CreateReporterArgs,
  Reporter,
};
