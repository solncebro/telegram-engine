import {
  splitMessageToChunkList,
  splitMessageByBoundary,
  sendSplitMessage,
  TELEGRAM_MESSAGE_SPLIT_LIMIT,
} from "../../src/message/splitMessage";

describe("splitMessageToChunkList", () => {
  it("should return single chunk for short message", () => {
    const result = splitMessageToChunkList("short message");

    expect(result).toEqual(["short message"]);
  });

  it("should split long message into chunks", () => {
    const line = "x".repeat(40) + "\n";
    const text = line.repeat(10);
    const result = splitMessageToChunkList(text, 100);

    expect(result.length).toBeGreaterThan(1);

    for (const chunk of result) {
      expect(chunk.length).toBeLessThanOrEqual(100);
    }
  });

  it("should handle single long line exceeding max length", () => {
    const longLine = "x".repeat(200);
    const text = `short\n${longLine}\nshort`;
    const result = splitMessageToChunkList(text, 100);

    expect(result.some((chunk) => chunk === longLine)).toBe(true);
  });

  it("should use default max length", () => {
    const result = splitMessageToChunkList("hello");

    expect(result).toEqual(["hello"]);
  });

  it("should trim trailing whitespace from chunks", () => {
    const text = "line1\nline2\nline3";
    const result = splitMessageToChunkList(text, 13);

    for (const chunk of result) {
      expect(chunk).toBe(chunk.trimEnd());
    }
  });

  it("should handle long line at the start followed by short lines", () => {
    const longLine = "x".repeat(200);
    const text = `${longLine}\nshort`;
    const result = splitMessageToChunkList(text, 100);

    expect(result[0]).toBe(longLine);
    expect(result[1]).toBe("short");
  });

  it("should handle text that splits exactly at maxLength boundary", () => {
    const text = "abc\ndef\nghi";
    const result = splitMessageToChunkList(text, 4);

    expect(result.length).toBeGreaterThan(1);

    for (const chunk of result) {
      expect(chunk).toBe(chunk.trimEnd());
    }
  });
});

describe("splitMessageByBoundary", () => {
  it("should return single part for short message", () => {
    const result = splitMessageByBoundary("short message", 100);

    expect(result).toEqual(["short message"]);
  });

  it("should split on blank-line boundaries first", () => {
    const blockA = "a".repeat(60);
    const blockB = "b".repeat(60);
    const message = `${blockA}\n\n${blockB}`;
    const result = splitMessageByBoundary(message, 100);

    expect(result).toEqual([blockA, blockB]);
  });

  it("should keep several small blocks together while under the limit", () => {
    const message = "block1\n\nblock2\n\nblock3";
    const result = splitMessageByBoundary(message, 100);

    expect(result).toEqual([message]);
  });

  it("should fall back to line boundaries for an oversized block", () => {
    const oversized = `${"x".repeat(60)}\n${"y".repeat(60)}`;
    const result = splitMessageByBoundary(oversized, 100);

    expect(result).toEqual(["x".repeat(60), "y".repeat(60)]);
  });

  it("should emit an unbreakable line as its own part", () => {
    const longLine = "z".repeat(200);
    const message = `short\n\n${longLine}`;
    const result = splitMessageByBoundary(message, 100);

    expect(result).toContain(longLine);
  });

  it("should never exceed the limit except for a single unbreakable line", () => {
    const message = Array.from({ length: 20 }, (_, i) => `block-${i}`).join("\n\n");
    const result = splitMessageByBoundary(message, 30);

    for (const part of result) {
      expect(part.length).toBeLessThanOrEqual(30);
    }
  });
});

describe("sendSplitMessage", () => {
  it("should send each part in order with its index", async () => {
    const sender = jest.fn().mockResolvedValue(undefined);
    const blockA = "a".repeat(60);
    const blockB = "b".repeat(60);

    await sendSplitMessage({ sender, message: `${blockA}\n\n${blockB}`, limit: 100 });

    expect(sender).toHaveBeenCalledTimes(2);
    expect(sender).toHaveBeenNthCalledWith(1, blockA, 0);
    expect(sender).toHaveBeenNthCalledWith(2, blockB, 1);
  });

  it("should default to TELEGRAM_MESSAGE_SPLIT_LIMIT", async () => {
    const sender = jest.fn().mockResolvedValue(undefined);

    await sendSplitMessage({ sender, message: "single short part" });

    expect(TELEGRAM_MESSAGE_SPLIT_LIMIT).toBe(3500);
    expect(sender).toHaveBeenCalledTimes(1);
    expect(sender).toHaveBeenCalledWith("single short part", 0);
  });
});
