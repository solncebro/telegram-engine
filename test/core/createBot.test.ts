import { createBot } from "../../src/core/createBot";

jest.mock("telegraf", () => ({
  Telegraf: jest.fn().mockImplementation(() => ({
    launch: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    catch: jest.fn(),
    telegram: {},
  })),
}));

describe("createBot", () => {
  it("should create bot instance with correct name", () => {
    const instance = createBot({
      botToken: "test-token",
      botName: "TestBot",
    });

    expect(instance.botName).toBe("TestBot");
    expect(instance.bot).toBeDefined();
  });

  it("should launch bot", async () => {
    const instance = createBot({
      botToken: "test-token",
      botName: "TestBot",
    });

    await instance.launch();

    expect(instance.bot.launch).toHaveBeenCalled();
  });

  it("should call onError when launch fails", async () => {
    const { Telegraf } = jest.requireMock("telegraf");

    Telegraf.mockImplementationOnce(() => ({
      launch: jest.fn().mockRejectedValue(new Error("launch failed")),
      stop: jest.fn(),
      catch: jest.fn(),
      telegram: {},
    }));

    const onError = jest.fn();
    const instance = createBot({
      botToken: "test-token",
      botName: "TestBot",
      onError,
    });

    await instance.launch();

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      "TestBot",
    );
  });

  it("should throw when launch fails without onError", async () => {
    const { Telegraf } = jest.requireMock("telegraf");

    Telegraf.mockImplementationOnce(() => ({
      launch: jest.fn().mockRejectedValue(new Error("launch failed")),
      stop: jest.fn(),
      catch: jest.fn(),
      telegram: {},
    }));

    const instance = createBot({
      botToken: "test-token",
      botName: "TestBot",
    });

    await expect(instance.launch()).rejects.toThrow("launch failed");
  });

  it("should stop bot", async () => {
    const instance = createBot({
      botToken: "test-token",
      botName: "TestBot",
    });

    await instance.stop("test");

    expect(instance.bot.stop).toHaveBeenCalledWith("test");
  });
});
