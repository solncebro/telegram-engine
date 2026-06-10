import { createWizard } from "../../src/menu/wizard";

interface OrderState {
  step: "direction" | "leverage" | "confirm";
  symbol: string;
  leverage?: number;
}

describe("createWizard", () => {
  it("is inactive until started", () => {
    const wizard = createWizard<OrderState>();

    expect(wizard.isActive("chat1")).toBe(false);
    expect(wizard.get("chat1")).toBeUndefined();
  });

  it("starts a session and reads it back", () => {
    const wizard = createWizard<OrderState>();

    wizard.start("chat1", { step: "direction", symbol: "BTCUSDT" });

    expect(wizard.isActive("chat1")).toBe(true);
    expect(wizard.get("chat1")).toEqual({ step: "direction", symbol: "BTCUSDT" });
  });

  it("returns the stored object by reference so in-place mutation persists", () => {
    const wizard = createWizard<OrderState>();
    wizard.start("chat1", { step: "direction", symbol: "BTCUSDT" });

    const session = wizard.get("chat1");
    session!.step = "leverage";
    session!.leverage = 5;

    expect(wizard.get("chat1")).toEqual({
      step: "leverage",
      symbol: "BTCUSDT",
      leverage: 5,
    });
  });

  it("patches step and data, keeping the same reference", () => {
    const wizard = createWizard<OrderState>();
    wizard.start("chat1", { step: "direction", symbol: "BTCUSDT" });
    const before = wizard.get("chat1");

    const after = wizard.patch("chat1", { step: "confirm", leverage: 10 });

    expect(after).toBe(before);
    expect(wizard.get("chat1")).toEqual({
      step: "confirm",
      symbol: "BTCUSDT",
      leverage: 10,
    });
  });

  it("patch on a missing session returns undefined", () => {
    const wizard = createWizard<OrderState>();

    expect(wizard.patch("missing", { leverage: 1 })).toBeUndefined();
  });

  it("reset clears the session", () => {
    const wizard = createWizard<OrderState>();
    wizard.start("chat1", { step: "direction", symbol: "BTCUSDT" });

    wizard.reset("chat1");

    expect(wizard.isActive("chat1")).toBe(false);
    expect(wizard.get("chat1")).toBeUndefined();
  });

  it("keeps sessions isolated per key", () => {
    const wizard = createWizard<OrderState>();
    wizard.start("chat1", { step: "direction", symbol: "BTCUSDT" });
    wizard.start("chat2", { step: "confirm", symbol: "ETHUSDT" });

    expect(wizard.get("chat1")?.symbol).toBe("BTCUSDT");
    expect(wizard.get("chat2")?.symbol).toBe("ETHUSDT");

    wizard.reset("chat1");

    expect(wizard.isActive("chat1")).toBe(false);
    expect(wizard.isActive("chat2")).toBe(true);
  });
});
