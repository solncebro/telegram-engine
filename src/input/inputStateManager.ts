import type { InputState, InputStateManager } from "../types/input.types";

const createInputStateManager = <
  TAction extends string,
  TData,
>(): InputStateManager<TAction, TData> => {
  const stateByChatId = new Map<string, InputState<TAction, TData>>();

  const get = (chatId: string) => stateByChatId.get(chatId);

  const set = (chatId: string, state: InputState<TAction, TData>) => {
    stateByChatId.set(chatId, state);
  };

  const deleteState = (chatId: string) => {
    stateByChatId.delete(chatId);
  };

  const has = (chatId: string) => stateByChatId.has(chatId);

  return { get, set, delete: deleteState, has };
};

export { createInputStateManager };
