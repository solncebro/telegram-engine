const BENIGN_EDIT_ERROR_MARKER_LIST = [
  "message is not modified",
  "message to edit not found",
  "message to delete not found",
  "message can't be deleted",
  "query is too old",
  "MESSAGE_ID_INVALID",
];

function isBenignTelegramEditError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return BENIGN_EDIT_ERROR_MARKER_LIST.some((marker) =>
    error.message.includes(marker),
  );
}

export { isBenignTelegramEditError };
