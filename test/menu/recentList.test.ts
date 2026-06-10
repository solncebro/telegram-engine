import {
  promoteToFront,
  buildPresetDisplayList,
} from "../../src/menu/recentList";

describe("promoteToFront", () => {
  it("returns single-element list when input list is empty", () => {
    expect(promoteToFront<number>([], 5, 3)).toEqual([5]);
  });

  it("prepends new value to the front", () => {
    expect(promoteToFront([5, 7, 9], 4, 5)).toEqual([4, 5, 7, 9]);
  });

  it("moves existing value to the front (dedup)", () => {
    expect(promoteToFront([1, 2, 3], 2, 5)).toEqual([2, 1, 3]);
  });

  it("truncates to maxCount after unshift", () => {
    expect(promoteToFront([1, 2, 3, 4, 5], 6, 5)).toEqual([6, 1, 2, 3, 4]);
  });

  it("drops from the right first when full and new value is fresh", () => {
    const list = [6, 4, 5, 7, 9];
    expect(promoteToFront(list, 10, 5)).toEqual([10, 6, 4, 5, 7]);
  });

  it("supports custom isEqual predicate for object dedup", () => {
    type Preset = { leverage: number; volumeUsdt: number };
    const list: Preset[] = [
      { leverage: 5, volumeUsdt: 100 },
      { leverage: 3, volumeUsdt: 50 },
    ];
    const newPreset: Preset = { leverage: 5, volumeUsdt: 100 };
    const result = promoteToFront(
      list,
      newPreset,
      2,
      (a, b) => a.leverage === b.leverage && a.volumeUsdt === b.volumeUsdt,
    );

    expect(result).toEqual([
      { leverage: 5, volumeUsdt: 100 },
      { leverage: 3, volumeUsdt: 50 },
    ]);
    expect(result[0]).toBe(newPreset);
  });

  it("does not mutate the input list", () => {
    const list = [1, 2, 3];
    const snapshot = [...list];
    promoteToFront(list, 2, 5);
    expect(list).toEqual(snapshot);
  });
});

describe("buildPresetDisplayList", () => {
  it("returns recents first then defaults without duplicates", () => {
    const result = buildPresetDisplayList({
      recentList: [7, 3],
      defaultList: [1, 3, 5],
      maxCount: 10,
    });

    expect(result).toEqual([7, 3, 1, 5]);
  });

  it("truncates merged list to maxCount", () => {
    const result = buildPresetDisplayList({
      recentList: [9, 8],
      defaultList: [1, 2, 3, 4],
      maxCount: 4,
    });

    expect(result).toEqual([9, 8, 1, 2]);
  });

  it("returns only defaults when recents are empty", () => {
    const result = buildPresetDisplayList({
      recentList: [],
      defaultList: [1, 2, 3],
      maxCount: 5,
    });

    expect(result).toEqual([1, 2, 3]);
  });

  it("dedups via custom isEqual predicate", () => {
    type Preset = { leverage: number };
    const result = buildPresetDisplayList<Preset>({
      recentList: [{ leverage: 5 }],
      defaultList: [{ leverage: 5 }, { leverage: 3 }],
      maxCount: 5,
      isEqual: (a, b) => a.leverage === b.leverage,
    });

    expect(result).toEqual([{ leverage: 5 }, { leverage: 3 }]);
  });

  it("does not mutate the input recentList", () => {
    const recentList = [9, 8];
    const snapshot = [...recentList];
    buildPresetDisplayList({ recentList, defaultList: [1, 2], maxCount: 5 });

    expect(recentList).toEqual(snapshot);
  });
});
