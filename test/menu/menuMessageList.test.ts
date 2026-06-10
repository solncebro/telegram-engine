import { buildMessageIdListToDelete } from "../../src/menu/menuMessageList";

describe("buildMessageIdListToDelete", () => {
  it("returns empty list when tracker is empty and callback id is undefined", () => {
    const result = buildMessageIdListToDelete({
      trackedIdList: [],
      callbackMessageId: undefined,
    });

    expect(result).toEqual([]);
  });

  it("returns only tracked ids when callback id is undefined", () => {
    const result = buildMessageIdListToDelete({
      trackedIdList: [10, 20, 30],
      callbackMessageId: undefined,
    });

    expect(result).toEqual([10, 20, 30]);
  });

  it("appends callback id at the end when it is not in tracked list", () => {
    const result = buildMessageIdListToDelete({
      trackedIdList: [10, 20],
      callbackMessageId: 99,
    });

    expect(result).toEqual([10, 20, 99]);
  });

  it("does not duplicate callback id when it is already in tracked list", () => {
    const result = buildMessageIdListToDelete({
      trackedIdList: [10, 20, 30],
      callbackMessageId: 20,
    });

    expect(result).toEqual([10, 20, 30]);
  });

  it("returns just the callback id when tracker is empty and callback id is defined", () => {
    const result = buildMessageIdListToDelete({
      trackedIdList: [],
      callbackMessageId: 42,
    });

    expect(result).toEqual([42]);
  });

  it("preserves the order of tracked ids", () => {
    const result = buildMessageIdListToDelete({
      trackedIdList: [50, 10, 30, 20],
      callbackMessageId: 99,
    });

    expect(result).toEqual([50, 10, 30, 20, 99]);
  });

  it("does not mutate the input trackedIdList", () => {
    const trackedIdList = [10, 20, 30];
    const snapshot = [...trackedIdList];
    buildMessageIdListToDelete({ trackedIdList, callbackMessageId: 99 });

    expect(trackedIdList).toEqual(snapshot);
  });
});
