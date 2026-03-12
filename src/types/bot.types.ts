import { Telegraf } from "telegraf";

interface CreateBotArgs {
  botToken: string;
  botName: string;
  onError?: (error: unknown, botName: string) => void;
}

interface BotInstance {
  bot: Telegraf;
  botName: string;
  launch: () => Promise<void>;
  stop: (reason?: string) => Promise<void>;
}

interface CreateAccessControlArgs {
  allowedPeerList: string[];
}

interface AccessControl {
  isAllowedPeer: (peer: string) => boolean;
  addPeer: (peer: string) => void;
  removePeer: (peer: string) => void;
}

type LogFunction = (message: string, data?: Record<string, unknown>) => void;

interface CreateSenderArgs {
  getBot: () => Telegraf | undefined;
  accessControl?: AccessControl;
  onLog?: LogFunction;
}

interface SendMessageArgs {
  message: string;
  peer: string;
  isSilentMessage?: boolean;
  useMarkdownV2?: boolean;
  returnMessageId?: boolean;
}

interface EditMessageArgs {
  chatId: string;
  messageId: number;
  text: string;
  useMarkdownV2?: boolean;
}

interface TelegramSender {
  sendMessage: (args: SendMessageArgs) => Promise<void | number>;
  pinMessage: (chatId: string, messageId: number) => Promise<void>;
  unpinMessage: (chatId: string, messageId: number) => Promise<void>;
  editMessage: (args: EditMessageArgs) => Promise<void>;
  deleteMessage: (chatId: string, messageId: number) => Promise<void>;
}

interface RegisteredBot {
  instance: BotInstance;
  sender: TelegramSender;
}

interface CreateBotRegistryArgs {
  allowedPeerList?: string[];
  onLog?: LogFunction;
}

interface BotRegistry {
  register: (args: CreateBotArgs) => BotInstance;
  get: (botName: string) => RegisteredBot | undefined;
  getBot: (botName: string) => Telegraf | undefined;
  createSender: (botName: string) => TelegramSender | undefined;
  accessControl: AccessControl;
  launchAll: () => Promise<void>;
  stopAll: (reason?: string) => Promise<void>;
}

export type {
  CreateBotArgs,
  BotInstance,
  CreateAccessControlArgs,
  AccessControl,
  LogFunction,
  CreateSenderArgs,
  SendMessageArgs,
  EditMessageArgs,
  TelegramSender,
  RegisteredBot,
  CreateBotRegistryArgs,
  BotRegistry,
};
