import type {
  StepHandlerMap,
  MenuRouter,
  MenuStepResult,
} from "../types/menu.types";

const createMenuRouter = <
  TStep extends string,
  TData,
>(
  stepHandlerMap: StepHandlerMap<TStep, TData>,
): MenuRouter<TStep, TData> => {
  const handleStep = async (
    step: TStep,
    data: Partial<TData>,
  ): Promise<MenuStepResult> => {
    const handler = stepHandlerMap[step];

    if (!handler) {
      throw new Error(`Unknown menu step: ${step}`);
    }

    return handler(data);
  };

  return { handleStep };
};

export { createMenuRouter };
