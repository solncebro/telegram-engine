interface InputState<TAction extends string, TData> {
  action: TAction;
  callbackData?: Partial<TData>;
  messageId?: number;
}

interface InputStateManager<TAction extends string, TData> {
  get: (chatId: string) => InputState<TAction, TData> | undefined;
  set: (chatId: string, state: InputState<TAction, TData>) => void;
  delete: (chatId: string) => void;
  has: (chatId: string) => boolean;
}

interface ValidateIntegerAndPositiveResult {
  isInteger: boolean;
  isPositive: boolean;
}

interface ParseCommaSeparatedRangeResult {
  isValid: boolean;
  errorMessage?: string;
  values?: {
    from?: number;
    to?: number;
  };
}

export type {
  InputState,
  InputStateManager,
  ValidateIntegerAndPositiveResult,
  ParseCommaSeparatedRangeResult,
};
