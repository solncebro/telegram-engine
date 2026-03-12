import type {
  ValidateIntegerAndPositiveResult,
  ParseCommaSeparatedRangeResult,
} from "../types/input.types";

const validatePositiveNumber = (value: number): boolean => value > 0;

const validateIntegerAndPositive = (
  value: number,
): ValidateIntegerAndPositiveResult => ({
  isInteger: Number.isInteger(value),
  isPositive: value > 0,
});

const parseCommaSeparatedRange = (
  text: string,
): ParseCommaSeparatedRangeResult => {
  const partList = text.split(",").map((part) => part.trim());

  if (partList.length !== 2) {
    return {
      isValid: false,
      errorMessage:
        "Invalid format. Use comma as separator: from,to or from, or ,to",
    };
  }

  const fromValue = partList[0] ? parseFloat(partList[0]) : undefined;
  const toValue = partList[1] ? parseFloat(partList[1]) : undefined;

  const valueList = [
    { value: fromValue, name: "from" },
    { value: toValue, name: "to" },
  ];

  for (const { value, name } of valueList) {
    if (value !== undefined && isNaN(value)) {
      return {
        isValid: false,
        errorMessage: `Invalid '${name}' value. Please try again.`,
      };
    }
  }

  if (fromValue === undefined && toValue === undefined) {
    return {
      isValid: false,
      errorMessage: "At least one value (from or to) must be specified.",
    };
  }

  return {
    isValid: true,
    values: {
      from: fromValue,
      to: toValue,
    },
  };
};

export {
  validatePositiveNumber,
  validateIntegerAndPositive,
  parseCommaSeparatedRange,
};
