import type {
  ActionHandlerMap,
  ActionRouter,
  MenuStepResult,
} from "../types/menu.types";

const createActionRouter = <
  TAction extends string,
  TData,
>(
  actionHandlerMap: ActionHandlerMap<TAction, TData>,
): ActionRouter<TAction, TData> => {
  const handleAction = async (
    action: TAction,
    data: Partial<TData>,
  ): Promise<MenuStepResult> => {
    const handler = actionHandlerMap[action];

    if (!handler) {
      throw new Error(`Unknown action: ${action}`);
    }

    return handler(data);
  };

  return { handleAction };
};

export { createActionRouter };
