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
