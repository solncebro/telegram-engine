import type {
  NavigationStepSchema,
  NavigationSchema,
} from "../types/menu.types";

const createNavigationSchema = <
  TStep extends string,
  TData,
>(
  schema: Record<TStep, NavigationStepSchema<TStep, TData>>,
): NavigationSchema<TStep, TData> => {
  const validateStepParams = (
    step: TStep,
    params: Partial<TData>,
  ): boolean => {
    const stepSchema = schema[step];

    if (!stepSchema) {
      return false;
    }

    for (const paramKey of stepSchema.requiredParamList) {
      if (params[paramKey] === undefined) {
        return false;
      }
    }

    return true;
  };

  const getBackDestination = (
    currentStep: TStep,
    currentParams: Partial<TData>,
  ): { step: TStep; params: Partial<TData> } | null => {
    const stepSchema = schema[currentStep];

    if (!stepSchema?.backTo) {
      return null;
    }

    const backParams: Partial<TData> = {};

    for (const paramKey of stepSchema.backParamList) {
      const paramValue = currentParams[paramKey];

      if (paramValue !== undefined) {
        (backParams as Record<string, unknown>)[paramKey as string] =
          paramValue;
      }
    }

    return {
      step: stepSchema.backTo,
      params: backParams,
    };
  };

  return { validateStepParams, getBackDestination };
};

export { createNavigationSchema };
