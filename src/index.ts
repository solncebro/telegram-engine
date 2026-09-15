export { Context, Markup, Telegraf } from "telegraf";

export { createBot } from "./core/createBot";
export { applyBotCrashGuard } from "./core/botCrashGuard";
export { createBotRegistry } from "./core/botRegistry";
export { createSender } from "./core/sender";
export { createAccessControl } from "./core/accessControl";

export { createCallbackEncoder } from "./menu/callbackEncoder";
export { createKeyboardBuilder } from "./menu/keyboardBuilder";
export { createMenuRouter } from "./menu/menuRouter";
export { createActionRouter } from "./menu/actionRouter";
export { createNavigationSchema } from "./menu/navigationSchema";
export { buildMessageIdListToDelete } from "./menu/menuMessageList";
export { promoteToFront, buildPresetDisplayList } from "./menu/recentList";
export { buildPresetKeyboard } from "./menu/presetKeyboard";
export { createMenuTree } from "./menu/menuTree";
export { createMenuReplacer } from "./menu/menuReplacer";
export { createLoadingController } from "./menu/loadingController";
export {
  buildDismissReplyMarkup,
  dismissKeyboard,
} from "./menu/dismissKeyboard";
export { createWizard } from "./menu/wizard";

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
  markdownV2Builder,
} from "./message/markdownV2";
export { splitMessageToChunkList, splitMessageByBoundary, sendSplitMessage, TELEGRAM_MESSAGE_SPLIT_LIMIT } from "./message/splitMessage";
export type { SendSplitMessageArgs } from "./message/splitMessage";
export { logFailedTelegramAlert } from "./message/telegramAlert";
export { createMessageTracker } from "./message/messageTracker";
export { deleteMessageListById } from "./message/deleteMessageList";
export { isBenignTelegramEditError } from "./message/telegramEditError";
export { editMessageWithFallback } from "./message/editMessageWithFallback";
export { applyIncomingMessageCleanup } from "./message/incomingMessageCleanup";
export type { ApplyIncomingMessageCleanupArgs } from "./message/incomingMessageCleanup";

export { broadcastToRecipients } from "./broadcast/broadcastToRecipients";
export { createBroadcaster } from "./broadcast/broadcaster";
export { createReporter } from "./broadcast/reporter";

export { registerBotCommands } from "./command/commandRegistrar";

export { pause } from "./utils/pause";
export {
  TELEGRAM_MESSAGE_MAX_LENGTH,
  DEFAULT_BROADCAST_PAUSE_MS,
  DEFAULT_MAX_PINNED_COUNT,
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

export type { BotCrashGuardArgs } from "./core/botCrashGuard";

export type {
  FieldConfig,
  CallbackEncoder,
  ButtonConfig,
  InlineKeyboard,
  NavigationButtonConfig,
  KeyboardBuilder,
  KeyboardLayout,
  NavigationStepSchema,
  NavigationSchema,
  MenuStepResult,
  StepHandlerMap,
  MenuRouter,
  ActionHandlerMap,
  ActionRouter,
  BuildMessageIdListToDeleteArgs,
  BuildPresetDisplayListArgs,
  BuildPresetKeyboardArgs,
  CreateMenuTreeArgs,
  MenuTreeFooterLabels,
  MenuTree,
} from "./types/menu.types";

export type {
  RawInlineButton,
  RawInlineKeyboardMarkup,
} from "./types/keyboard.types";

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
} from "./types/lifecycle.types";

export type { Wizard } from "./types/wizard.types";

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
  BroadcastToRecipientsArgs,
  CreateBroadcasterArgs,
  BroadcastExtra,
  SendAndPinArgs,
  Broadcaster,
  CreateReporterArgs,
  Reporter,
} from "./types/broadcast.types";

export type {
  CommandConfig,
  RegisterBotCommandsArgs,
} from "./types/command.types";
