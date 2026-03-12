import { TelegramSender, LogFunction } from "./bot.types";

interface CreateBroadcasterArgs {
  sender: TelegramSender;
  recipientList: string[];
  onLog?: LogFunction;
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
  ) => Promise<void>;
  reportError: (message: string, error: unknown) => Promise<void>;
}

export type {
  CreateBroadcasterArgs,
  SendAndPinArgs,
  Broadcaster,
  CreateReporterArgs,
  Reporter,
};
