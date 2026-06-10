import type { BuildPresetDisplayListArgs } from "../types/menu.types";

function promoteToFront<T>(
  list: T[],
  value: T,
  maxCount: number,
  isEqual: (a: T, b: T) => boolean = (a, b) => a === b,
): T[] {
  const filtered = list.filter((item) => !isEqual(item, value));

  return [value, ...filtered].slice(0, maxCount);
}

function buildPresetDisplayList<T>(args: BuildPresetDisplayListArgs<T>): T[] {
  const { recentList, defaultList, maxCount } = args;
  const isEqual = args.isEqual ?? ((a: T, b: T) => a === b);
  const mergedList = [...recentList];

  for (const value of defaultList) {
    if (!mergedList.some((existing) => isEqual(existing, value))) {
      mergedList.push(value);
    }
  }

  return mergedList.slice(0, maxCount);
}

export { promoteToFront, buildPresetDisplayList };
