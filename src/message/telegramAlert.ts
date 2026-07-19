const logFailedTelegramAlert = (promise: Promise<unknown>, contextLabel: string): void => {
  promise.catch((error: unknown) => {
    // Intentional last-resort console output: this fire-and-forget helper has no
    // access to the consumer's logger, so a rejected alert is surfaced here.
    // eslint-disable-next-line no-console
    console.error(contextLabel, error);
  });
};

export { logFailedTelegramAlert };
