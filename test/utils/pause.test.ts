import { pause } from "../../src/utils/pause";

describe("pause", () => {
  it("should resolve after specified time", async () => {
    const start = Date.now();

    await pause(50);

    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });
});
