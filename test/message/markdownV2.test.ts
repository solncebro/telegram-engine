import {
  escapeMarkdownV2Text,
  escapeMarkdownV2WithFormatting,
  formatClickableText,
  markdownV2Builder,
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

describe("markdownV2Builder", () => {
  it("should create bold text", () => {
    expect(markdownV2Builder.bold("YES")).toBe("*YES*");
  });

  it("should escape special characters inside bold", () => {
    expect(markdownV2Builder.bold("100.5")).toBe("*100\\.5*");
  });

  it("should escape parentheses and colon inside bold", () => {
    expect(markdownV2Builder.bold("Performance (without commission):")).toBe(
      "*Performance \\(without commission\\):*",
    );
  });

  it("should create code without escaping content", () => {
    expect(markdownV2Builder.code("BTCUSDT")).toBe("`BTCUSDT`");
    expect(markdownV2Builder.code("2026-03-14 14:30:45")).toBe("`2026-03-14 14:30:45`");
  });

  it("should create italic text", () => {
    expect(markdownV2Builder.italic("note")).toBe("_note_");
  });

  it("should create strikethrough text", () => {
    expect(markdownV2Builder.strikethrough("old")).toBe("~old~");
  });

  it("should create spoiler text", () => {
    expect(markdownV2Builder.spoiler("hidden")).toBe("||hidden||");
  });

  it("should create link with escaped text and url", () => {
    expect(markdownV2Builder.link("click", "http://x.com")).toBe(
      "[click](http://x\\.com)",
    );
  });

  it("should escape text via markdownV2Builder.escape", () => {
    expect(markdownV2Builder.escape("+125.50")).toBe("\\+125\\.50");
    expect(markdownV2Builder.escape("2026-03-14")).toBe("2026\\-03\\-14");
  });
});

describe("escapeMarkdownV2WithFormatting", () => {
  describe("real messages from coin-listing (Firebase settings)", () => {
    it("should handle full Firebase settings message", () => {
      const input =
        "⚙️ FIREBASE SETTINGS RECEIVED:\n\nModule Active: ✅ *YES* (was: NO)\nOrder Volume: *100 USDT* (was: 50 USDT)\nTake Profit: *40%*\nStop Loss: *20%*\nLeverage: *3x*";
      const expected =
        "⚙️ FIREBASE SETTINGS RECEIVED:\n\nModule Active: ✅ *YES* \\(was: NO\\)\nOrder Volume: *100 USDT* \\(was: 50 USDT\\)\nTake Profit: *40%*\nStop Loss: *20%*\nLeverage: *3x*";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });

    it("should handle single boolean setting", () => {
      const input = "Module Active: ✅ *YES*";
      const expected = "Module Active: ✅ *YES*";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });

    it("should handle numeric setting with was", () => {
      const input = "Order Volume: *100 USDT* (was: 50 USDT)";
      const expected = "Order Volume: *100 USDT* \\(was: 50 USDT\\)";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });

    it("should handle array setting without bold", () => {
      const input =
        "Excluded Symbols: BTCUSDT, ETHUSDT (Added: ETHUSDT; Removed: BNBUSDT)";
      const expected =
        "Excluded Symbols: BTCUSDT, ETHUSDT \\(Added: ETHUSDT; Removed: BNBUSDT\\)";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });
  });

  describe("patterns from kliner-autotrade-funding", () => {
    it("should handle daily report header with date", () => {
      const input = "🧾 *Daily Report* 2026-03-14";
      const expected = "🧾 *Daily Report* 2026\\-03\\-14";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });

    it("should handle PNL line with plus and dot", () => {
      const input = "🟢 PNL: +125.50$";
      const expected = "🟢 PNL: \\+125\\.50$";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });

    it("should handle funding report with bold, parentheses, and dash", () => {
      const input = "🎯 BTCUSDT - *LONG*\nFunding: *0.05%* (24h)";
      const expected =
        "🎯 BTCUSDT \\- *LONG*\nFunding: *0\\.05%* \\(24h\\)";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });

    it("should handle system state report with inline code and bold", () => {
      const input =
        "📊 *System State Report*\nLatest: `2026-03-14 14:30:45`\nTotal: 42";
      const expected =
        "📊 *System State Report*\nLatest: `2026-03-14 14:30:45`\nTotal: 42";

      expect(escapeMarkdownV2WithFormatting(input)).toBe(expected);
    });
  });

  describe("edge cases", () => {
    it("should escape unpaired marker", () => {
      expect(escapeMarkdownV2WithFormatting("Single * star")).toBe(
        "Single \\* star",
      );
    });

    it("should handle multiple format types", () => {
      expect(escapeMarkdownV2WithFormatting("*bold* and _italic_")).toBe(
        "*bold* and _italic_",
      );
    });

    it("should escape text without formatting", () => {
      expect(escapeMarkdownV2WithFormatting("No formatting (test)")).toBe(
        "No formatting \\(test\\)",
      );
    });

    it("should escape dot inside bold", () => {
      expect(escapeMarkdownV2WithFormatting("Price: *10.5 USDT*")).toBe(
        "Price: *10\\.5 USDT*",
      );
    });

    it("should handle empty string", () => {
      expect(escapeMarkdownV2WithFormatting("")).toBe("");
    });

    it("should preserve emoji", () => {
      expect(escapeMarkdownV2WithFormatting("⚙️ ✅ ❌")).toBe("⚙️ ✅ ❌");
    });
  });
});
