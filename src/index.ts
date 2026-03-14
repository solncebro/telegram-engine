export { Context, Markup, Telegraf } from "telegraf";

export { createBot } from "./core/createBot";
export { createBotRegistry } from "./core/botRegistry";
export { createSender } from "./core/sender";
export { createAccessControl } from "./core/accessControl";

export { createCallbackEncoder } from "./menu/callbackEncoder";
export { createKeyboardBuilder } from "./menu/keyboardBuilder";
export { createMenuRouter } from "./menu/menuRouter";
export { createActionRouter } from "./menu/actionRouter";
export { createNavigationSchema } from "./menu/navigationSchema";

export { createInputStateManager } from "./input/inputStateManager";
export {
  validatePositiveNumber,
  validateIntegerAndPositive,
  parseCommaSeparatedRange,
} from "./input/inputValidator";

export {
  escapeMarkdownV2Text,
  escapeMarkdownV2WithFormatting,
  formatClickableText,
  md,
} from "./message/markdownV2";
export { splitMessageToChunkList } from "./message/splitMessage";
export { createMessageTracker } from "./message/messageTracker";
export { deleteMessageListById } from "./message/deleteMessageList";

export { createBroadcaster } from "./broadcast/broadcaster";
export { createReporter } from "./broadcast/reporter";

export { registerBotCommands } from "./command/commandRegistrar";

export { pause } from "./utils/pause";
export {
  TELEGRAM_MESSAGE_MAX_LENGTH,
  DEFAULT_BROADCAST_PAUSE_MS,
} from "./utils/constants";

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
} from "./types/bot.types";

export type {
  FieldConfig,
  CallbackEncoder,
  ButtonConfig,
  InlineKeyboard,
  NavigationButtonConfig,
  KeyboardBuilder,
  NavigationStepSchema,
  NavigationSchema,
  MenuStepResult,
  StepHandlerMap,
  MenuRouter,
  ActionHandlerMap,
  ActionRouter,
} from "./types/menu.types";

export type {
  InputState,
  InputStateManager,
  ValidateIntegerAndPositiveResult,
  ParseCommaSeparatedRangeResult,
} from "./types/input.types";

export type {
  MessageTracker,
  DeleteMessageListByIdArgs,
} from "./types/message.types";

export type {
  CreateBroadcasterArgs,
  SendAndPinArgs,
  Broadcaster,
  CreateReporterArgs,
  Reporter,
} from "./types/broadcast.types";

export type {
  CommandConfig,
  RegisterBotCommandsArgs,
} from "./types/command.types";
