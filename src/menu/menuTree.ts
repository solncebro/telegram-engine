import type { RawInlineButton } from "../types/keyboard.types";
import type {
  CreateMenuTreeArgs,
  MenuTree,
  MenuTreeFooterLabels,
} from "../types/menu.types";
import type { NavigationStepSchema } from "../types/menu.types";
import { createNavigationSchema } from "./navigationSchema";

type EmptyData = Record<string, never>;

function createMenuTree<TScreen extends string>(
  args: CreateMenuTreeArgs<TScreen>,
): MenuTree<TScreen> {
  const { parentByScreen, resolveParent } = args;

  const schema = {} as Record<TScreen, NavigationStepSchema<TScreen, EmptyData>>;

  for (const screen of Object.keys(parentByScreen) as TScreen[]) {
    schema[screen] = {
      requiredParamList: [],
      backTo: parentByScreen[screen],
      backParamList: [],
    };
  }

  const navigationSchema = createNavigationSchema<TScreen, EmptyData>(schema);

  const getParent = (screen: TScreen): TScreen | null => {
    const staticParent =
      navigationSchema.getBackDestination(screen, {})?.step ?? null;

    return resolveParent ? resolveParent(screen, staticParent) : staticParent;
  };

  const isValidScreen = (value: string): value is TScreen =>
    Object.prototype.hasOwnProperty.call(parentByScreen, value);

  const buildFooterRow = (
    screen: TScreen,
    labels: MenuTreeFooterLabels,
  ): RawInlineButton[] => {
    const parent = getParent(screen);
    const row: RawInlineButton[] = [];

    if (parent !== null) {
      row.push({ text: labels.backText, callback_data: labels.backCallbackData });
    }

    row.push({ text: labels.closeText, callback_data: labels.closeCallbackData });

    return row;
  };

  return { getParent, isValidScreen, buildFooterRow };
}

export { createMenuTree };
