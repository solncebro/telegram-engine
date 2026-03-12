import {
  validatePositiveNumber,
  validateIntegerAndPositive,
  parseCommaSeparatedRange,
} from "../../src/input/inputValidator";

describe("validatePositiveNumber", () => {
  it("should return true for positive numbers", () => {
    expect(validatePositiveNumber(1)).toBe(true);
    expect(validatePositiveNumber(0.5)).toBe(true);
  });

  it("should return false for zero and negative numbers", () => {
    expect(validatePositiveNumber(0)).toBe(false);
    expect(validatePositiveNumber(-1)).toBe(false);
  });
});

describe("validateIntegerAndPositive", () => {
  it("should validate integer and positive", () => {
    expect(validateIntegerAndPositive(5)).toEqual({
      isInteger: true,
      isPositive: true,
    });
  });

  it("should detect non-integer", () => {
    expect(validateIntegerAndPositive(5.5)).toEqual({
      isInteger: false,
      isPositive: true,
    });
  });

  it("should detect non-positive", () => {
    expect(validateIntegerAndPositive(-3)).toEqual({
      isInteger: true,
      isPositive: false,
    });
  });
});

describe("parseCommaSeparatedRange", () => {
  it("should parse valid range", () => {
    const result = parseCommaSeparatedRange("100,200");

    expect(result).toEqual({
      isValid: true,
      values: { from: 100, to: 200 },
    });
  });

  it("should parse range with spaces", () => {
    const result = parseCommaSeparatedRange("100, 200");

    expect(result).toEqual({
      isValid: true,
      values: { from: 100, to: 200 },
    });
  });

  it("should parse from-only range", () => {
    const result = parseCommaSeparatedRange("100,");

    expect(result).toEqual({
      isValid: true,
      values: { from: 100, to: undefined },
    });
  });

  it("should parse to-only range", () => {
    const result = parseCommaSeparatedRange(",200");

    expect(result).toEqual({
      isValid: true,
      values: { from: undefined, to: 200 },
    });
  });

  it("should reject invalid format", () => {
    const result = parseCommaSeparatedRange("100");

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBeDefined();
  });

  it("should reject non-numeric values", () => {
    const result = parseCommaSeparatedRange("abc,200");

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain("from");
  });

  it("should reject empty values", () => {
    const result = parseCommaSeparatedRange(",");

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain("At least one value");
  });

  it("should handle negative values", () => {
    const result = parseCommaSeparatedRange("-50,50");

    expect(result).toEqual({
      isValid: true,
      values: { from: -50, to: 50 },
    });
  });
});
