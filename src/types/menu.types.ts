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

/** How a flat button list is laid out: `columnCount` buttons per row (1 = one per row, the default). */
interface KeyboardLayout {
  columnCount?: number;
}

interface KeyboardBuilder<TData> {
  /** Lays the flat list out in rows of `columnCount` (the call's layout, else the builder's default,
   *  else one per row); the navigation pair, when given, is always the last row. */
  build: (
    buttonConfigList: Array<ButtonConfig<TData>>,
    navigationConfig?: NavigationButtonConfig<TData>,
    layout?: KeyboardLayout,
  ) => InlineKeyboard;
  /** Keeps the caller's rows exactly as given — for keyboards whose shape carries meaning (a
   *  headline button alone on top, a fixed pair at the bottom); the navigation pair is the last row. */
  buildRows: (
    rowList: Array<Array<ButtonConfig<TData>>>,
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
  KeyboardLayout,
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
