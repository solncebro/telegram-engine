import { Markup } from "telegraf";
import { createActionRouter } from "../../src/menu/actionRouter";

type TestAction = "save" | "delete";

interface TestData {
  id: number;
}

describe("createActionRouter", () => {
  const router = createActionRouter<TestAction, TestData>({
    save: async (data) => ({
      messageList: [`Saved ${data.id}`],
      keyboard: Markup.inlineKeyboard([]),
    }),
    delete: () => ({
      messageList: ["Deleted"],
      keyboard: Markup.inlineKeyboard([]),
    }),
  });

  it("should handle async action", async () => {
    const result = await router.handleAction("save", { id: 1 });

    expect(result.messageList).toEqual(["Saved 1"]);
  });

  it("should handle sync action", async () => {
    const result = await router.handleAction("delete", {});

    expect(result.messageList).toEqual(["Deleted"]);
  });

  it("should throw for unknown action", async () => {
    await expect(
      router.handleAction("unknown" as TestAction, {}),
    ).rejects.toThrow("Unknown action: unknown");
  });
});
