interface Wizard<TState extends object> {
  start: (key: string, state: TState) => void;
  get: (key: string) => TState | undefined;
  patch: (key: string, patch: Partial<TState>) => TState | undefined;
  reset: (key: string) => void;
  isActive: (key: string) => boolean;
}

export type { Wizard };
