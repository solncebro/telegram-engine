import { createCallbackEncoder } from "../../src/menu/callbackEncoder";
import type { FieldConfig } from "../../src/types/menu.types";

interface TestData {
  step: string;
  action: string;
  value: number;
}

const fieldConfigList: Array<FieldConfig<TestData>> = [
  {
    key: "step",
    shortCode: "s",
    encode: (v) => String(v),
    decode: (v) => String(v),
  },
  {
    key: "action",
    shortCode: "a",
    encode: (v) => String(v),
    decode: (v) => String(v),
  },
  {
    key: "value",
    shortCode: "v",
    encode: (v) => Number(v),
    decode: (v) => Number(v),
  },
];

describe("createCallbackEncoder", () => {
  const encoder = createCallbackEncoder<TestData>(fieldConfigList);

  it("should encode data to compact JSON", () => {
    const result = encoder.encode({ step: "main", action: "show" });
    const parsed = JSON.parse(result);

    expect(parsed.s).toBe("main");
    expect(parsed.a).toBe("show");
    expect(parsed.v).toBeUndefined();
  });

  it("should decode compact JSON back to data", () => {
    const encoded = encoder.encode({ step: "main", value: 42 });
    const decoded = encoder.decode(encoded);

    expect(decoded).toEqual({ step: "main", value: 42 });
  });

  it("should skip undefined values during encoding", () => {
    const result = encoder.encode({ step: "test" });
    const parsed = JSON.parse(result);

    expect(Object.keys(parsed)).toEqual(["s"]);
  });

  it("should return null for invalid JSON", () => {
    expect(encoder.decode("invalid")).toBeNull();
  });

  it("should return null for empty object", () => {
    expect(encoder.decode("{}")).toBeNull();
  });

  it("should return null for object with unknown keys", () => {
    expect(encoder.decode('{"x":"y"}')).toBeNull();
  });

  it("should skip fields with unknown keys during encode", () => {
    const result = encoder.encode({ step: "main", unknownField: "val" } as never);
    const parsed = JSON.parse(result);

    expect(parsed.s).toBe("main");
    expect(Object.keys(parsed)).toEqual(["s"]);
  });

  it("should skip unknown short codes during decode", () => {
    const result = encoder.decode('{"s":"main","z":"unknown"}');

    expect(result).toEqual({ step: "main" });
  });
});
