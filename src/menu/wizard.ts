import type { Wizard } from "../types/wizard.types";

// Generic multi-step session holder. Knows nothing about what the steps mean —
// the application declares its own step union and state shape, drives the
// transitions, and renders each step itself. The library only keeps the current
// step + accumulated data per key (e.g. per chat) and lets the app move between
// them. Sessions are stored by reference so the app may mutate the returned
// object in place; `patch` is provided for an immutable-friendly update style.
function createWizard<TState extends object>(): Wizard<TState> {
  const sessionByKey = new Map<string, TState>();

  const start = (key: string, state: TState): void => {
    sessionByKey.set(key, state);
  };

  const get = (key: string): TState | undefined => sessionByKey.get(key);

  const patch = (
    key: string,
    patchValue: Partial<TState>,
  ): TState | undefined => {
    const existing = sessionByKey.get(key);

    if (existing === undefined) {
      return undefined;
    }

    Object.assign(existing, patchValue);

    return existing;
  };

  const reset = (key: string): void => {
    sessionByKey.delete(key);
  };

  const isActive = (key: string): boolean => sessionByKey.has(key);

  return { start, get, patch, reset, isActive };
}

export { createWizard };
