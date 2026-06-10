import type { Context } from "telegraf";

import { editMessageWithFallback } from "../../src/message/editMessageWithFallback";

interface MockContext {
  editMessageCaption: jest.Mock;
  editMessageText: jest.Mock;
}

function createMockContext(): MockContext {
  return {
    editMessageCaption: jest.fn(),
    editMessageText: jest.fn(),
  };
}

describe("editMessageWithFallback", () => {
  it("edits caption first and does not touch text on success", async () => {
    const ctx = createMockContext();

    await editMessageWithFallback(ctx as unknown as Context, "hello");

    expect(ctx.editMessageCaption).toHaveBeenCalledWith("hello", {
      parse_mode: "MarkdownV2",
    });
    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });

  it("falls back to text edit when message has no caption", async () => {
    const ctx = createMockContext();
    ctx.editMessageCaption.mockRejectedValueOnce(
      new Error("Bad Request: there is no caption in the message to edit"),
    );

    await editMessageWithFallback(ctx as unknown as Context, "hello");

    expect(ctx.editMessageText).toHaveBeenCalledWith("hello", {
      parse_mode: "MarkdownV2",
    });
  });

  it("falls back to text edit when message has no text either", async () => {
    const ctx = createMockContext();
    ctx.editMessageCaption.mockRejectedValueOnce(
      new Error("Bad Request: there is no text in the message to edit"),
    );

    await editMessageWithFallback(ctx as unknown as Context, "hello");

    expect(ctx.editMessageText).toHaveBeenCalledTimes(1);
  });

  it("rethrows unrelated caption errors without falling back", async () => {
    const ctx = createMockContext();
    ctx.editMessageCaption.mockRejectedValueOnce(
      new Error("Bad Request: chat not found"),
    );

    await expect(
      editMessageWithFallback(ctx as unknown as Context, "hello"),
    ).rejects.toThrow("chat not found");
    expect(ctx.editMessageText).not.toHaveBeenCalled();
  });

  it("passes a custom extra through to both edit calls", async () => {
    const ctx = createMockContext();
    ctx.editMessageCaption.mockRejectedValueOnce(
      new Error("there is no caption in the message to edit"),
    );

    await editMessageWithFallback(ctx as unknown as Context, "plain", {});

    expect(ctx.editMessageCaption).toHaveBeenCalledWith("plain", {});
    expect(ctx.editMessageText).toHaveBeenCalledWith("plain", {});
  });
});
