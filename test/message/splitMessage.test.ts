import { splitMessageToChunkList } from "../../src/message/splitMessage";

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
