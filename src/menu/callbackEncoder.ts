import type { FieldConfig, CallbackEncoder } from "../types/menu.types";

const createCallbackEncoder = <TData>(
  fieldConfigList: Array<FieldConfig<TData>>,
): CallbackEncoder<TData> => {
  const fieldConfigByShortCode = new Map<string, FieldConfig<TData>>();
  const fieldConfigByKey = new Map<keyof TData, FieldConfig<TData>>();

  for (const config of fieldConfigList) {
    fieldConfigByShortCode.set(config.shortCode, config);
    fieldConfigByKey.set(config.key, config);
  }

  const encode = (data: Partial<TData>): string => {
    const encoded: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        continue;
      }

      const config = fieldConfigByKey.get(key as keyof TData);

      if (!config) {
        continue;
      }

      encoded[config.shortCode] = config.encode(value);
    }

    return JSON.stringify(encoded);
  };

  const decode = (raw: string): Partial<TData> | null => {
    try {
      const parsed = JSON.parse(raw) as Record<string, string | number>;
      const result: Partial<TData> = {};
      let hasAnyField = false;

      for (const [shortCode, value] of Object.entries(parsed)) {
        const config = fieldConfigByShortCode.get(shortCode);

        if (!config) {
          continue;
        }

        (result as Record<string, unknown>)[config.key as string] =
          config.decode(value);
        hasAnyField = true;
      }

      if (!hasAnyField) {
        return null;
      }

      return result;
    } catch {
      return null;
    }
  };

  return { encode, decode };
};

export { createCallbackEncoder };
