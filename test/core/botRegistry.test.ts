import { createBotRegistry } from "../../src/core/botRegistry";

jest.mock("telegraf", () => ({
  Telegraf: jest.fn().mockImplementation(() => ({
    launch: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    telegram: {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 1 }),
      pinChatMessage: jest.fn(),
      unpinChatMessage: jest.fn(),
      editMessageText: jest.fn(),
      deleteMessage: jest.fn(),
    },
  })),
}));

describe("createBotRegistry", () => {
  it("should register and retrieve bots", () => {
    const registry = createBotRegistry();

    registry.register({ botToken: "token1", botName: "Bot1" });
    registry.register({ botToken: "token2", botName: "Bot2" });

    expect(registry.get("Bot1")).toBeDefined();
    expect(registry.get("Bot2")).toBeDefined();
    expect(registry.get("Bot3")).toBeUndefined();
  });

  it("should get telegraf instance by name", () => {
    const registry = createBotRegistry();

    registry.register({ botToken: "token1", botName: "Bot1" });

    expect(registry.getBot("Bot1")).toBeDefined();
    expect(registry.getBot("Unknown")).toBeUndefined();
  });

  it("should create sender for registered bot", () => {
    const registry = createBotRegistry();

    registry.register({ botToken: "token1", botName: "Bot1" });

    const sender = registry.createSender("Bot1");

    expect(sender).toBeDefined();
    expect(registry.createSender("Unknown")).toBeUndefined();
  });

  it("should launch all bots", async () => {
    const registry = createBotRegistry();
    const bot1 = registry.register({ botToken: "t1", botName: "B1" });
    const bot2 = registry.register({ botToken: "t2", botName: "B2" });

    await registry.launchAll();

    expect(bot1.bot.launch).toHaveBeenCalled();
    expect(bot2.bot.launch).toHaveBeenCalled();
  });

  it("should stop all bots", async () => {
    const registry = createBotRegistry();
    const bot1 = registry.register({ botToken: "t1", botName: "B1" });
    const bot2 = registry.register({ botToken: "t2", botName: "B2" });

    await registry.stopAll("shutdown");

    expect(bot1.bot.stop).toHaveBeenCalledWith("shutdown");
    expect(bot2.bot.stop).toHaveBeenCalledWith("shutdown");
  });
});
