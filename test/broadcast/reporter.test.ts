import { createReporter } from "../../src/broadcast/reporter";
import type { Broadcaster } from "../../src/types/broadcast.types";
import type { RawInlineKeyboardMarkup } from "../../src/types/keyboard.types";

const createMockBroadcaster = (): Broadcaster => ({
  sendToAll: jest.fn().mockResolvedValue(undefined),
  sendChunkedToAll: jest.fn().mockResolvedValue(undefined),
  sendAndPin: jest.fn().mockResolvedValue(undefined),
});

describe("createReporter", () => {
  describe("reportEvent", () => {
    it("should broadcast event message", async () => {
      const broadcaster = createMockBroadcaster();
      const reporter = createReporter({ broadcaster });

      await reporter.reportEvent("deploy complete");

      expect(broadcaster.sendToAll).toHaveBeenCalledWith(
        "deploy complete",
        false,
      );
    });

    it("should retry on first failure", async () => {
      const broadcaster = createMockBroadcaster();

      (broadcaster.sendToAll as jest.Mock)
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(undefined);

      const reporter = createReporter({ broadcaster });

      await reporter.reportEvent("message");

      expect(broadcaster.sendToAll).toHaveBeenCalledTimes(2);
    });

    // reporter.ts wraps sendToAll, so the KATUSDT 09.09.2026 "retry entry"
    // keyboard has to reach it through the wrapper too.
    it("should forward replyMarkup to sendToAll when given", async () => {
      const broadcaster = createMockBroadcaster();
      const reporter = createReporter({ broadcaster });
      const replyMarkup: RawInlineKeyboardMarkup = {
        inline_keyboard: [[{ text: "Retry entry", callback_data: "retry_entry" }]],
      };

      await reporter.reportEvent("entry rejected", false, { replyMarkup });

      expect(broadcaster.sendToAll).toHaveBeenCalledWith(
        "entry rejected",
        false,
        { replyMarkup },
      );
    });
  });

  describe("reportError", () => {
    it("should broadcast error message", async () => {
      const broadcaster = createMockBroadcaster();
      const reporter = createReporter({ broadcaster });

      await reporter.reportError("something broke", new Error("oops"));

      expect(broadcaster.sendToAll).toHaveBeenCalledWith(
        "something broke",
        undefined,
      );
    });

    it("should retry on first failure", async () => {
      const broadcaster = createMockBroadcaster();

      (broadcaster.sendToAll as jest.Mock)
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(undefined);

      const reporter = createReporter({ broadcaster });

      await reporter.reportError("error msg", new Error("test"));

      expect(broadcaster.sendToAll).toHaveBeenCalledTimes(2);
      expect(broadcaster.sendToAll).toHaveBeenCalledWith(
        "error msg (retry)",
        undefined,
      );
    });

    it("should not throw when both attempts fail", async () => {
      const broadcaster = createMockBroadcaster();

      (broadcaster.sendToAll as jest.Mock)
        .mockRejectedValueOnce(new Error("fail1"))
        .mockRejectedValueOnce(new Error("fail2"));

      const reporter = createReporter({ broadcaster });

      await expect(
        reporter.reportError("error msg", new Error("test")),
      ).resolves.toBeUndefined();
    });
  });
});
