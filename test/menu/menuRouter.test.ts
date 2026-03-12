import { Markup } from "telegraf";
import { createMenuRouter } from "../../src/menu/menuRouter";

type TestStep = "main" | "settings";

interface TestData {
  id: number;
}

describe("createMenuRouter", () => {
  const router = createMenuRouter<TestStep, TestData>({
    main: () => ({
      messageList: ["Main menu"],
      keyboard: Markup.inlineKeyboard([]),
    }),
    settings: async (data) => ({
      messageList: [`Settings for ${data.id}`],
      keyboard: Markup.inlineKeyboard([]),
    }),
  });

  it("should handle sync step", async () => {
    const result = await router.handleStep("main", {});

    expect(result.messageList).toEqual(["Main menu"]);
  });

  it("should handle async step with data", async () => {
    const result = await router.handleStep("settings", { id: 42 });

    expect(result.messageList).toEqual(["Settings for 42"]);
  });

  it("should throw for unknown step", async () => {
    await expect(
      router.handleStep("unknown" as TestStep, {}),
    ).rejects.toThrow("Unknown menu step: unknown");
  });
});
