import { createInputStateManager } from "../../src/input/inputStateManager";

type TestAction = "edit" | "delete";

interface TestData {
  id: number;
}

describe("createInputStateManager", () => {
  it("should set and get state", () => {
    const manager = createInputStateManager<TestAction, TestData>();

    manager.set("chat1", { action: "edit", callbackData: { id: 1 } });

    expect(manager.get("chat1")).toEqual({
      action: "edit",
      callbackData: { id: 1 },
    });
  });

  it("should return undefined for missing chat", () => {
    const manager = createInputStateManager<TestAction, TestData>();

    expect(manager.get("missing")).toBeUndefined();
  });

  it("should check existence", () => {
    const manager = createInputStateManager<TestAction, TestData>();

    manager.set("chat1", { action: "edit" });

    expect(manager.has("chat1")).toBe(true);
    expect(manager.has("chat2")).toBe(false);
  });

  it("should delete state", () => {
    const manager = createInputStateManager<TestAction, TestData>();

    manager.set("chat1", { action: "edit" });
    manager.delete("chat1");

    expect(manager.has("chat1")).toBe(false);
  });
});
