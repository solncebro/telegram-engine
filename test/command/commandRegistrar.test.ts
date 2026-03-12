import { registerBotCommands } from "../../src/command/commandRegistrar";

const createMockContext = (chatId?: number) => ({
  chat: chatId !== undefined ? { id: chatId } : undefined,
  updateType: "message" as const,
});

const DEFAULT_CHAT_ID = 123;

const createMockBot = () => ({
  telegram: {
    setMyCommands: jest.fn().mockResolvedValue(true),
  },
  command: jest.fn(),
  on: jest.fn(),
  catch: jest.fn(),
});

describe("registerBotCommands", () => {
  it("should set telegram commands", async () => {
    const bot = createMockBot();

    await registerBotCommands({
      bot: bot as never,
      commandConfigList: [
        {
          command: "start",
          description: "Start bot",
          handler: jest.fn(),
        },
        {
          command: "help",
          description: "Show help",
          handler: jest.fn(),
        },
      ],
    });

    expect(bot.telegram.setMyCommands).toHaveBeenCalledWith([
      { command: "start", description: "Start bot" },
      { command: "help", description: "Show help" },
    ]);
  });

  it("should register command handlers", async () => {
    const bot = createMockBot();

    await registerBotCommands({
      bot: bot as never,
      commandConfigList: [
        {
          command: "menu",
          description: "Menu",
          handler: jest.fn(),
        },
      ],
    });

    expect(bot.command).toHaveBeenCalledWith("menu", expect.any(Function));
  });

  it("should register callback query handler", async () => {
    const bot = createMockBot();
    const cbHandler = jest.fn();

    await registerBotCommands({
      bot: bot as never,
      commandConfigList: [],
      callbackQueryHandler: cbHandler,
    });

    expect(bot.on).toHaveBeenCalledWith(
      "callback_query",
      expect.any(Function),
    );
  });

  it("should register message handler", async () => {
    const bot = createMockBot();
    const msgHandler = jest.fn();

    await registerBotCommands({
      bot: bot as never,
      commandConfigList: [],
      messageHandler: msgHandler,
    });

    expect(bot.on).toHaveBeenCalledWith("message", expect.any(Function));
  });

  it("should register error catcher", async () => {
    const bot = createMockBot();

    await registerBotCommands({
      bot: bot as never,
      commandConfigList: [],
    });

    expect(bot.catch).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should not register callback_query handler when not provided", async () => {
    const bot = createMockBot();

    await registerBotCommands({
      bot: bot as never,
      commandConfigList: [],
    });

    const onCalls = bot.on.mock.calls.map(
      (call: [string, unknown]) => call[0],
    );

    expect(onCalls).not.toContain("callback_query");
  });

  describe("command handler execution", () => {
    it("should call command handler when peer is allowed", async () => {
      const bot = createMockBot();
      const handler = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [
          { command: "test", description: "Test", handler },
        ],
      });

      const registeredHandler = bot.command.mock.calls[0][1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(handler).toHaveBeenCalled();
    });

    it("should block command handler when peer is not allowed", async () => {
      const bot = createMockBot();
      const handler = jest.fn();
      const accessControl = {
        isAllowedPeer: jest.fn().mockReturnValue(false),
        addPeer: jest.fn(),
        removePeer: jest.fn(),
      };

      await registerBotCommands({
        bot: bot as never,
        accessControl,
        commandConfigList: [
          { command: "test", description: "Test", handler },
        ],
      });

      const registeredHandler = bot.command.mock.calls[0][1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(handler).not.toHaveBeenCalled();
    });

    it("should allow all when accessControl is not provided", async () => {
      const bot = createMockBot();
      const handler = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [
          { command: "test", description: "Test", handler },
        ],
      });

      const registeredHandler = bot.command.mock.calls[0][1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(handler).toHaveBeenCalled();
    });

    it("should call onError when command handler throws", async () => {
      const bot = createMockBot();
      const onError = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [
          {
            command: "fail",
            description: "Fail",
            handler: jest.fn().mockRejectedValue(new Error("boom")),
          },
        ],
        onError,
      });

      const registeredHandler = bot.command.mock.calls[0][1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(onError).toHaveBeenCalledWith(
        "Error handling /fail",
        expect.objectContaining({ error: "boom", chatId: "123" }),
      );
    });

    it("should handle non-Error throws in command handler", async () => {
      const bot = createMockBot();
      const onError = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [
          {
            command: "fail",
            description: "Fail",
            handler: jest.fn().mockRejectedValue("string error"),
          },
        ],
        onError,
      });

      const registeredHandler = bot.command.mock.calls[0][1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(onError).toHaveBeenCalledWith(
        "Error handling /fail",
        expect.objectContaining({ error: "string error" }),
      );
    });

    it("should handle missing chat id in context", async () => {
      const bot = createMockBot();
      const onError = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [
          {
            command: "fail",
            description: "Fail",
            handler: jest.fn().mockRejectedValue(new Error("boom")),
          },
        ],
        onError,
      });

      const registeredHandler = bot.command.mock.calls[0][1];

      await registeredHandler(createMockContext(undefined));

      expect(onError).toHaveBeenCalledWith(
        "Error handling /fail",
        expect.objectContaining({ chatId: "" }),
      );
    });
  });

  describe("callback query handler execution", () => {
    it("should call callback query handler when allowed", async () => {
      const bot = createMockBot();
      const cbHandler = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [],
        callbackQueryHandler: cbHandler,
      });

      const registeredHandler = bot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === "callback_query",
      )[1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(cbHandler).toHaveBeenCalled();
    });

    it("should block callback query when peer not allowed", async () => {
      const bot = createMockBot();
      const cbHandler = jest.fn();
      const accessControl = {
        isAllowedPeer: jest.fn().mockReturnValue(false),
        addPeer: jest.fn(),
        removePeer: jest.fn(),
      };

      await registerBotCommands({
        bot: bot as never,
        accessControl,
        commandConfigList: [],
        callbackQueryHandler: cbHandler,
      });

      const registeredHandler = bot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === "callback_query",
      )[1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(cbHandler).not.toHaveBeenCalled();
    });

    it("should call onError when callback query handler throws", async () => {
      const bot = createMockBot();
      const onError = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [],
        callbackQueryHandler: jest.fn().mockRejectedValue(new Error("cb fail")),
        onError,
      });

      const registeredHandler = bot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === "callback_query",
      )[1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(onError).toHaveBeenCalledWith(
        "Error handling callback query",
        expect.objectContaining({ error: "cb fail" }),
      );
    });
  });

  describe("message handler execution", () => {
    it("should call message handler when allowed", async () => {
      const bot = createMockBot();
      const msgHandler = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [],
        messageHandler: msgHandler,
      });

      const registeredHandler = bot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === "message",
      )[1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(msgHandler).toHaveBeenCalled();
    });

    it("should block message handler when peer not allowed", async () => {
      const bot = createMockBot();
      const msgHandler = jest.fn();
      const accessControl = {
        isAllowedPeer: jest.fn().mockReturnValue(false),
        addPeer: jest.fn(),
        removePeer: jest.fn(),
      };

      await registerBotCommands({
        bot: bot as never,
        accessControl,
        commandConfigList: [],
        messageHandler: msgHandler,
      });

      const registeredHandler = bot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === "message",
      )[1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(msgHandler).not.toHaveBeenCalled();
    });

    it("should call onError when message handler throws", async () => {
      const bot = createMockBot();
      const onError = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [],
        messageHandler: jest.fn().mockRejectedValue(new Error("msg fail")),
        onError,
      });

      const registeredHandler = bot.on.mock.calls.find(
        (call: [string, unknown]) => call[0] === "message",
      )[1];

      await registeredHandler(createMockContext(DEFAULT_CHAT_ID));

      expect(onError).toHaveBeenCalledWith(
        "Error handling message",
        expect.objectContaining({ error: "msg fail" }),
      );
    });
  });

  describe("bot.catch handler", () => {
    it("should call onError with error details", async () => {
      const bot = createMockBot();
      const onError = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [],
        onError,
      });

      const catchHandler = bot.catch.mock.calls[0][0];

      catchHandler(new Error("unhandled"), {
        updateType: "message",
        chat: { id: 456 },
      });

      expect(onError).toHaveBeenCalledWith(
        "Unhandled bot error",
        expect.objectContaining({
          error: "unhandled",
          updateType: "message",
          chatId: 456,
        }),
      );
    });

    it("should handle non-Error in bot.catch", async () => {
      const bot = createMockBot();
      const onError = jest.fn();

      await registerBotCommands({
        bot: bot as never,
        commandConfigList: [],
        onError,
      });

      const catchHandler = bot.catch.mock.calls[0][0];

      catchHandler("string error", {
        updateType: "callback_query",
        chat: undefined,
      });

      expect(onError).toHaveBeenCalledWith(
        "Unhandled bot error",
        expect.objectContaining({
          error: "string error",
          updateType: "callback_query",
        }),
      );
    });
  });
});
