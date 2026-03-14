import { createReporter } from "../../src/broadcast/reporter";
import type { Broadcaster } from "../../src/types/broadcast.types";

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
