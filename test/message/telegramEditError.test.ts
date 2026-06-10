import { isBenignTelegramEditError } from "../../src/message/telegramEditError";

describe("isBenignTelegramEditError", () => {
  const benignMessageList = [
    "Bad Request: message is not modified",
    "Bad Request: message to edit not found",
    "Bad Request: message to delete not found",
    "Bad Request: message can't be deleted for everyone",
    "Bad Request: query is too old and response timeout expired",
    "Bad Request: MESSAGE_ID_INVALID",
  ];

  it.each(benignMessageList)("treats %s as benign", (message) => {
    expect(isBenignTelegramEditError(new Error(message))).toBe(true);
  });

  it("treats an unrelated error as non-benign", () => {
    expect(
      isBenignTelegramEditError(new Error("Bad Request: chat not found")),
    ).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isBenignTelegramEditError("message is not modified")).toBe(false);
    expect(isBenignTelegramEditError(undefined)).toBe(false);
    expect(isBenignTelegramEditError(null)).toBe(false);
  });
});
