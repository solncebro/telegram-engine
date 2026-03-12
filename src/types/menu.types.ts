import { Markup } from "telegraf";

interface FieldConfig<TData> {
  key: keyof TData;
  shortCode: string;
  encode: (value: unknown) => string | number;
  decode: (value: string | number) => unknown;
}

interface CallbackEncoder<TData> {
  encode: (data: Partial<TData>) => string;
  decode: (raw: string) => Partial<TData> | null;
}

interface ButtonConfig<TData> {
  text: string;
  callbackData: Partial<TData>;
}

type InlineKeyboard = ReturnType<typeof Markup.inlineKeyboard>;

interface NavigationButtonConfig<TData> {
  backText?: string;
  mainMenuText?: string;
  backCallbackData: Partial<TData>;
  mainMenuCallbackData: Partial<TData>;
}

interface KeyboardBuilder<TData> {
  build: (
    buttonConfigList: Array<ButtonConfig<TData>>,
    navigationConfig?: NavigationButtonConfig<TData>,
  ) => InlineKeyboard;
}

interface NavigationStepSchema<TStep extends string, TData> {
  requiredParamList: Array<keyof TData>;
  backTo: TStep | null;
  backParamList: Array<keyof TData>;
}

interface NavigationSchema<TStep extends string, TData> {
  validateStepParams: (step: TStep, params: Partial<TData>) => boolean;
  getBackDestination: (
    currentStep: TStep,
    currentParams: Partial<TData>,
  ) => { step: TStep; params: Partial<TData> } | null;
}

interface MenuStepResult {
  messageList: string[];
  keyboard: InlineKeyboard;
}

type StepHandlerMap<TStep extends string, TData> = Record<
  TStep,
  (data: Partial<TData>) => Promise<MenuStepResult> | MenuStepResult
>;

interface MenuRouter<TStep extends string, TData> {
  handleStep: (step: TStep, data: Partial<TData>) => Promise<MenuStepResult>;
}

type ActionHandlerMap<TAction extends string, TData> = Record<
  TAction,
  (data: Partial<TData>) => Promise<MenuStepResult> | MenuStepResult
>;

interface ActionRouter<TAction extends string, TData> {
  handleAction: (
    action: TAction,
    data: Partial<TData>,
  ) => Promise<MenuStepResult>;
}

export type {
  FieldConfig,
  CallbackEncoder,
  ButtonConfig,
  InlineKeyboard,
  NavigationButtonConfig,
  KeyboardBuilder,
  NavigationStepSchema,
  NavigationSchema,
  MenuStepResult,
  StepHandlerMap,
  MenuRouter,
  ActionHandlerMap,
  ActionRouter,
};
