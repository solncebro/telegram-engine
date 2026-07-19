import { logFailedTelegramAlert } from "../../src/message/telegramAlert";

describe("logFailedTelegramAlert", () => {
  it("should log rejection reason with the context label", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = new Error("send failed");
    const rejected = Promise.reject(error);

    logFailedTelegramAlert(rejected, "alert:broadcast");

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith("alert:broadcast", error);

    consoleErrorSpy.mockRestore();
  });

  it("should not log when the promise resolves", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    logFailedTelegramAlert(Promise.resolve("ok"), "alert:ok");

    await Promise.resolve();
    await Promise.resolve();

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
