import {
  escapeMarkdownV2Text,
  formatClickableText,
} from "../../src/message/markdownV2";

describe("escapeMarkdownV2Text", () => {
  it("should escape special characters", () => {
    expect(escapeMarkdownV2Text("hello_world")).toBe("hello\\_world");
    expect(escapeMarkdownV2Text("price: 100.5$")).toBe("price: 100\\.5$");
    expect(escapeMarkdownV2Text("a*b")).toBe("a\\*b");
  });

  it("should handle numbers", () => {
    expect(escapeMarkdownV2Text(42)).toBe("42");
    expect(escapeMarkdownV2Text(3.14)).toBe("3\\.14");
  });

  it("should handle empty string", () => {
    expect(escapeMarkdownV2Text("")).toBe("");
  });

  it("should handle string with no special characters", () => {
    expect(escapeMarkdownV2Text("hello")).toBe("hello");
  });

  it("should escape all special characters", () => {
    const input = "_*[]()~`>#+-=|{}.!";
    const expected =
      "\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!";

    expect(escapeMarkdownV2Text(input)).toBe(expected);
  });
});

describe("formatClickableText", () => {
  it("should wrap text in backticks", () => {
    expect(formatClickableText("BTCUSDT")).toBe("`BTCUSDT`");
  });

  it("should handle numbers", () => {
    expect(formatClickableText(123)).toBe("`123`");
  });
});
