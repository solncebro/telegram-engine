import { createKeyboardBuilder } from "../../src/menu/keyboardBuilder";
import type { CallbackEncoder } from "../../src/types/menu.types";

interface TestData {
  step: string;
  action: string;
}

const createMockEncoder = (): CallbackEncoder<TestData> => ({
  encode: jest.fn((data: Partial<TestData>) => JSON.stringify(data)),
  decode: jest.fn(),
});

describe("createKeyboardBuilder", () => {
  it("should build keyboard with buttons", () => {
    const encoder = createMockEncoder();
    const builder = createKeyboardBuilder<TestData>(encoder);

    const keyboard = builder.build([
      { text: "Option 1", callbackData: { step: "list" } },
      { text: "Option 2", callbackData: { step: "detail" } },
    ]);

    expect(keyboard).toBeDefined();
    expect(encoder.encode).toHaveBeenCalledTimes(2);
    expect(encoder.encode).toHaveBeenCalledWith({ step: "list" });
    expect(encoder.encode).toHaveBeenCalledWith({ step: "detail" });
  });

  it("should build keyboard without navigation", () => {
    const encoder = createMockEncoder();
    const builder = createKeyboardBuilder<TestData>(encoder);

    const keyboard = builder.build([
      { text: "Solo", callbackData: { action: "save" } },
    ]);

    expect(keyboard).toBeDefined();
    expect(encoder.encode).toHaveBeenCalledTimes(1);
  });

  it("should build keyboard with navigation buttons", () => {
    const encoder = createMockEncoder();
    const builder = createKeyboardBuilder<TestData>(encoder);

    const keyboard = builder.build(
      [{ text: "Item", callbackData: { step: "detail" } }],
      {
        backCallbackData: { step: "list" },
        mainMenuCallbackData: { step: "main" },
      },
    );

    expect(keyboard).toBeDefined();
    expect(encoder.encode).toHaveBeenCalledTimes(3);
    expect(encoder.encode).toHaveBeenCalledWith({ step: "detail" });
    expect(encoder.encode).toHaveBeenCalledWith({ step: "list" });
    expect(encoder.encode).toHaveBeenCalledWith({ step: "main" });
  });

  it("should use custom navigation button text", () => {
    const encoder = createMockEncoder();
    const builder = createKeyboardBuilder<TestData>(encoder);

    const keyboard = builder.build([], {
      backText: "Назад",
      mainMenuText: "Главная",
      backCallbackData: { step: "list" },
      mainMenuCallbackData: { step: "main" },
    });

    expect(keyboard).toBeDefined();
    expect(encoder.encode).toHaveBeenCalledWith({ step: "list" });
    expect(encoder.encode).toHaveBeenCalledWith({ step: "main" });
  });

  it("should use default navigation button text", () => {
    const encoder = createMockEncoder();
    const builder = createKeyboardBuilder<TestData>(encoder);

    builder.build([], {
      backCallbackData: { step: "list" },
      mainMenuCallbackData: { step: "main" },
    });

    expect(encoder.encode).toHaveBeenCalledTimes(2);
  });
});

describe("createKeyboardBuilder — column layout", () => {
  const rowsOf = (keyboard: { reply_markup: { inline_keyboard: unknown[][] } }): unknown[][] => keyboard.reply_markup.inline_keyboard;
  const buttonList = [
    { text: "A", callbackData: { step: "a" } },
    { text: "B", callbackData: { step: "b" } },
    { text: "C", callbackData: { step: "c" } },
  ];

  it("keeps one button per row by default", () => {
    const builder = createKeyboardBuilder<TestData>(createMockEncoder());

    expect(rowsOf(builder.build(buttonList)).map((row) => row.length)).toEqual([1, 1, 1]);
  });

  it("lays buttons out in the builder's column count, navigation as the last row", () => {
    const builder = createKeyboardBuilder<TestData>(createMockEncoder(), { columnCount: 2 });
    const keyboard = builder.build(buttonList, { backCallbackData: { step: "list" }, mainMenuCallbackData: { step: "main" } });

    expect(rowsOf(keyboard).map((row) => row.length)).toEqual([2, 1, 2]);
  });

  it("lets one call override the column count", () => {
    const builder = createKeyboardBuilder<TestData>(createMockEncoder(), { columnCount: 2 });

    expect(rowsOf(builder.build(buttonList, undefined, { columnCount: 3 })).map((row) => row.length)).toEqual([3]);
    expect(rowsOf(builder.build(buttonList, undefined, { columnCount: 1 })).map((row) => row.length)).toEqual([1, 1, 1]);
  });

  it("buildRows keeps the caller's rows exactly, navigation as the last row", () => {
    const encoder = createMockEncoder();
    const builder = createKeyboardBuilder<TestData>(encoder, { columnCount: 2 });
    const keyboard = builder.buildRows(
      [[buttonList[0]], [buttonList[1], buttonList[2]]],
      { backCallbackData: { step: "list" }, mainMenuCallbackData: { step: "main" } },
    );

    expect(rowsOf(keyboard).map((row) => row.length)).toEqual([1, 2, 2]);
    expect(encoder.encode).toHaveBeenCalledTimes(5);
  });
});
