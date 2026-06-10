import { buildPresetKeyboard } from "../../src/menu/presetKeyboard";

describe("buildPresetKeyboard", () => {
  it("renders single-row keyboard with formatted text and callback_data", () => {
    const result = buildPresetKeyboard({
      valueList: [1, 3, 5],
      callbackPrefix: "leverage",
      formatText: (v) => `${v}x`,
    });

    expect(result).toEqual([
      [
        { text: "1x", callback_data: "leverage:1" },
        { text: "3x", callback_data: "leverage:3" },
        { text: "5x", callback_data: "leverage:5" },
      ],
    ]);
  });

  it("truncates by maxCount", () => {
    const result = buildPresetKeyboard({
      valueList: [0.5, 1, 2, 3, 5, 10],
      callbackPrefix: "spread",
      formatText: (v) => `${v}%`,
      maxCount: 5,
    });

    expect(result[0]).toHaveLength(5);
    expect(result[0][0].text).toBe("0.5%");
    expect(result[0][4].text).toBe("5%");
  });

  it("handles empty valueList", () => {
    const result = buildPresetKeyboard({
      valueList: [],
      callbackPrefix: "orderCount",
      formatText: String,
    });

    expect(result).toEqual([[]]);
  });

  it("supports custom formatter (signed offset)", () => {
    const result = buildPresetKeyboard({
      valueList: [-1, 0, 1],
      callbackPrefix: "offset",
      formatText: (v) => `${v}%`,
    });

    expect(result[0].map((b) => b.text)).toEqual(["-1%", "0%", "1%"]);
    expect(result[0].map((b) => b.callback_data)).toEqual([
      "offset:-1",
      "offset:0",
      "offset:1",
    ]);
  });
});
