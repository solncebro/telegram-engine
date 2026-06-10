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

interface BuildMessageIdListToDeleteArgs {
  trackedIdList: number[];
  callbackMessageId?: number;
}

interface BuildPresetDisplayListArgs<T> {
  recentList: T[];
  defaultList: T[];
  maxCount: number;
  isEqual?: (a: T, b: T) => boolean;
}

interface BuildPresetKeyboardArgs<T extends number | string> {
  valueList: readonly T[];
  callbackPrefix: string;
  formatText: (value: T) => string;
  maxCount?: number;
}

interface CreateMenuTreeArgs<TScreen extends string> {
  parentByScreen: Record<TScreen, TScreen | null>;
  resolveParent?: (screen: TScreen, staticParent: TScreen | null) => TScreen | null;
}

interface MenuTreeFooterLabels {
  backText: string;
  backCallbackData: string;
  closeText: string;
  closeCallbackData: string;
}

interface MenuTree<TScreen extends string> {
  getParent: (screen: TScreen) => TScreen | null;
  isValidScreen: (value: string) => value is TScreen;
  buildFooterRow: (
    screen: TScreen,
    labels: MenuTreeFooterLabels,
  ) => Array<{ text: string; callback_data: string }>;
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
  BuildMessageIdListToDeleteArgs,
  BuildPresetDisplayListArgs,
  BuildPresetKeyboardArgs,
  CreateMenuTreeArgs,
  MenuTreeFooterLabels,
  MenuTree,
};
