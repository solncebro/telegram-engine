import { createNavigationSchema } from "../../src/menu/navigationSchema";
import type { NavigationStepSchema } from "../../src/types/menu.types";

type TestStep = "main" | "list" | "detail";

interface TestData {
  categoryId: string;
  itemId: number;
}

const schema: Record<TestStep, NavigationStepSchema<TestStep, TestData>> = {
  main: {
    requiredParamList: [],
    backTo: null,
    backParamList: [],
  },
  list: {
    requiredParamList: ["categoryId"],
    backTo: "main",
    backParamList: [],
  },
  detail: {
    requiredParamList: ["categoryId", "itemId"],
    backTo: "list",
    backParamList: ["categoryId"],
  },
};

describe("createNavigationSchema", () => {
  const nav = createNavigationSchema<TestStep, TestData>(schema);

  describe("validateStepParams", () => {
    it("should return false for unknown step", () => {
      expect(nav.validateStepParams("unknown" as never, {})).toBe(false);
    });

    it("should validate main step without params", () => {
      expect(nav.validateStepParams("main", {})).toBe(true);
    });

    it("should validate list step with required param", () => {
      expect(nav.validateStepParams("list", { categoryId: "cat1" })).toBe(
        true,
      );
    });

    it("should fail list step without required param", () => {
      expect(nav.validateStepParams("list", {})).toBe(false);
    });

    it("should validate detail step with all params", () => {
      expect(
        nav.validateStepParams("detail", {
          categoryId: "cat1",
          itemId: 1,
        }),
      ).toBe(true);
    });

    it("should fail detail step with missing param", () => {
      expect(nav.validateStepParams("detail", { categoryId: "cat1" })).toBe(
        false,
      );
    });
  });

  describe("getBackDestination", () => {
    it("should return null for main step", () => {
      expect(nav.getBackDestination("main", {})).toBeNull();
    });

    it("should navigate from list back to main", () => {
      const result = nav.getBackDestination("list", { categoryId: "cat1" });

      expect(result).toEqual({ step: "main", params: {} });
    });

    it("should navigate from detail back to list with categoryId", () => {
      const result = nav.getBackDestination("detail", {
        categoryId: "cat1",
        itemId: 5,
      });

      expect(result).toEqual({
        step: "list",
        params: { categoryId: "cat1" },
      });
    });
  });
});
