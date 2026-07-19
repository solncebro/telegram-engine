import { broadcastToRecipients } from "../../src/broadcast/broadcastToRecipients";

describe("broadcastToRecipients", () => {
  it("should call sendToPeer for every recipient", async () => {
    const sendToPeer = jest.fn().mockResolvedValue(undefined);

    await broadcastToRecipients({
      recipientList: ["a", "b", "c"],
      sendToPeer,
    });

    expect(sendToPeer).toHaveBeenCalledTimes(3);
    expect(sendToPeer).toHaveBeenCalledWith("a");
    expect(sendToPeer).toHaveBeenCalledWith("b");
    expect(sendToPeer).toHaveBeenCalledWith("c");
  });

  it("should isolate a failing recipient and still reach the others", async () => {
    const sendToPeer = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    const onLog = jest.fn();

    await broadcastToRecipients({
      recipientList: ["a", "b", "c"],
      sendToPeer,
      onLog,
    });

    expect(sendToPeer).toHaveBeenCalledTimes(3);
    expect(onLog).toHaveBeenCalledWith(
      "Failed to send to peer",
      expect.objectContaining({ peer: "b", error: "boom" }),
    );
  });

  it("should use a custom error log message", async () => {
    const sendToPeer = jest.fn().mockRejectedValue(new Error("x"));
    const onLog = jest.fn();

    await broadcastToRecipients({
      recipientList: ["a"],
      sendToPeer,
      onLog,
      errorLogMessage: "custom failure",
    });

    expect(onLog).toHaveBeenCalledWith(
      "custom failure",
      expect.objectContaining({ peer: "a", error: "x" }),
    );
  });

  it("should not throw when a peer fails and no onLog is provided", async () => {
    const sendToPeer = jest.fn().mockRejectedValue(new Error("x"));

    await expect(
      broadcastToRecipients({ recipientList: ["a"], sendToPeer }),
    ).resolves.toBeUndefined();
  });

  it("should resolve without calling sendToPeer on an empty recipient list", async () => {
    const sendToPeer = jest.fn();

    await broadcastToRecipients({ recipientList: [], sendToPeer });

    expect(sendToPeer).not.toHaveBeenCalled();
  });
});
