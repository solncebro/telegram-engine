import * as TelegramEngine from "../src";

describe("exports", () => {
  const expectedExportList = [
    "createBot",
    "applyBotCrashGuard",
    "createBotRegistry",
    "createSender",
    "createAccessControl",
    "createCallbackEncoder",
    "createKeyboardBuilder",
    "createMenuRouter",
    "createActionRouter",
    "createNavigationSchema",
    "buildMessageIdListToDelete",
    "promoteToFront",
    "buildPresetDisplayList",
    "buildPresetKeyboard",
    "createMenuTree",
    "createMenuReplacer",
    "createLoadingController",
    "buildDismissReplyMarkup",
    "dismissKeyboard",
    "createWizard",
    "createInputStateManager",
    "validatePositiveNumber",
    "validateIntegerAndPositive",
    "parseCommaSeparatedRange",
    "escapeMarkdownV2Text",
    "escapeMarkdownV2WithFormatting",
    "formatClickableText",
    "markdownV2Builder",
    "splitMessageToChunkList",
    "splitMessageByBoundary",
    "sendSplitMessage",
    "TELEGRAM_MESSAGE_SPLIT_LIMIT",
    "logFailedTelegramAlert",
    "applyIncomingMessageCleanup",
    "createMessageTracker",
    "deleteMessageListById",
    "isBenignTelegramEditError",
    "editMessageWithFallback",
    "broadcastToRecipients",
    "createBroadcaster",
    "createReporter",
    "registerBotCommands",
    "pause",
    "TELEGRAM_MESSAGE_MAX_LENGTH",
    "DEFAULT_BROADCAST_PAUSE_MS",
    "DEFAULT_MAX_PINNED_COUNT",
  ];

  it.each(expectedExportList)("should export %s", (exportName) => {
    expect(
      TelegramEngine[exportName as keyof typeof TelegramEngine],
    ).toBeDefined();
  });
});
