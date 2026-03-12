import * as TelegramEngine from "../src";

describe("exports", () => {
  const expectedExportList = [
    "createBot",
    "createBotRegistry",
    "createSender",
    "createAccessControl",
    "createCallbackEncoder",
    "createKeyboardBuilder",
    "createMenuRouter",
    "createActionRouter",
    "createNavigationSchema",
    "createInputStateManager",
    "validatePositiveNumber",
    "validateIntegerAndPositive",
    "parseCommaSeparatedRange",
    "escapeMarkdownV2Text",
    "formatClickableText",
    "splitMessageToChunkList",
    "createMessageTracker",
    "deleteMessageListById",
    "createBroadcaster",
    "createReporter",
    "registerBotCommands",
    "pause",
    "TELEGRAM_MESSAGE_MAX_LENGTH",
    "DEFAULT_BROADCAST_PAUSE_MS",
  ];

  it.each(expectedExportList)("should export %s", (exportName) => {
    expect(
      TelegramEngine[exportName as keyof typeof TelegramEngine],
    ).toBeDefined();
  });
});
