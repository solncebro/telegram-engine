import { createMenuTree } from "../../src/menu/menuTree";

type Screen = "root" | "settings" | "trigger" | "trigger_a" | "exp" | "exp_root";

const parentByScreen: Record<Screen, Screen | null> = {
  root: null,
  settings: "root",
  trigger: "settings",
  trigger_a: "trigger",
  exp: "root",
  exp_root: null,
};

describe("createMenuTree.getParent", () => {
  it("returns the static parent of a leaf screen", () => {
    const tree = createMenuTree({ parentByScreen });

    expect(tree.getParent("trigger_a")).toBe("trigger");
    expect(tree.getParent("settings")).toBe("root");
  });

  it("returns null for a root screen", () => {
    const tree = createMenuTree({ parentByScreen });

    expect(tree.getParent("root")).toBeNull();
    expect(tree.getParent("exp_root")).toBeNull();
  });

  it("applies a dynamic resolveParent override", () => {
    const tree = createMenuTree({
      parentByScreen,
      resolveParent: (screen, staticParent) =>
        screen === "exp" ? "exp_root" : staticParent,
    });

    expect(tree.getParent("exp")).toBe("exp_root");
    expect(tree.getParent("settings")).toBe("root");
  });
});

describe("createMenuTree.isValidScreen", () => {
  it("recognises known screens", () => {
    const tree = createMenuTree({ parentByScreen });

    expect(tree.isValidScreen("trigger")).toBe(true);
    expect(tree.isValidScreen("unknown")).toBe(false);
  });
});

describe("createMenuTree.buildFooterRow", () => {
  const labels = {
    backText: "⬅️ Back",
    backCallbackData: "settings_back",
    closeText: "❌ Close",
    closeCallbackData: "settings_close",
  };

  it("includes Back + Close for a non-root screen", () => {
    const tree = createMenuTree({ parentByScreen });

    expect(tree.buildFooterRow("settings", labels)).toEqual([
      { text: "⬅️ Back", callback_data: "settings_back" },
      { text: "❌ Close", callback_data: "settings_close" },
    ]);
  });

  it("includes only Close for a root screen", () => {
    const tree = createMenuTree({ parentByScreen });

    expect(tree.buildFooterRow("root", labels)).toEqual([
      { text: "❌ Close", callback_data: "settings_close" },
    ]);
  });
});
