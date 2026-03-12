import { createMessageTracker } from "../../src/message/messageTracker";

describe("createMessageTracker", () => {
  it("should set and get message ids", () => {
    const tracker = createMessageTracker();

    tracker.set("chat1", [1, 2, 3]);

    expect(tracker.get("chat1")).toEqual([1, 2, 3]);
  });

  it("should return empty array for missing chat", () => {
    const tracker = createMessageTracker();

    expect(tracker.get("missing")).toEqual([]);
  });

  it("should delete tracked messages", () => {
    const tracker = createMessageTracker();

    tracker.set("chat1", [1, 2]);
    tracker.delete("chat1");

    expect(tracker.get("chat1")).toEqual([]);
  });

  it("should cleanup and return messages", () => {
    const tracker = createMessageTracker();

    tracker.set("chat1", [1, 2, 3]);

    const cleaned = tracker.cleanup("chat1");

    expect(cleaned).toEqual([1, 2, 3]);
    expect(tracker.get("chat1")).toEqual([]);
  });

  it("should cleanup excluding specific message id", () => {
    const tracker = createMessageTracker();

    tracker.set("chat1", [1, 2, 3]);

    const cleaned = tracker.cleanup("chat1", 2);

    expect(cleaned).toEqual([1, 3]);
    expect(tracker.get("chat1")).toEqual([]);
  });

  it("should return empty array when cleaning up missing chat", () => {
    const tracker = createMessageTracker();

    expect(tracker.cleanup("missing")).toEqual([]);
  });
});
