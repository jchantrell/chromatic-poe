import { describe, expect, it } from "vitest";
import { getQuery, TableNames } from "./queries";

describe("getQuery", () => {
  describe("V1 items query", () => {
    it("includes Exceptional gem class via GemTags", () => {
      const query = getQuery("3.25.3", "items");

      expect(query).toContain("'Exceptional'");
      expect(query).toContain("'exceptional'");
    });

    it("joins through GemEffects and GemTags tables", () => {
      const query = getQuery("3.25.3", "items");

      expect(query).toContain('"3.25.3_GemEffects"');
      expect(query).toContain('"3.25.3_GemTags"');
    });

    it("classifies Exceptional gems before Awakened/Vaal/Active/Support", () => {
      const query = getQuery("3.25.3", "items");

      const exceptionalPos = query.indexOf("'Exceptional'");
      const awakenedPos = query.indexOf("'Awakened'");
      const vaalPos = query.indexOf("'Vaal'");
      const activePos = query.indexOf("'Active'");
      const supportPos = query.indexOf("'Support'");

      expect(exceptionalPos).toBeGreaterThan(-1);
      expect(exceptionalPos).toBeLessThan(awakenedPos);
      expect(exceptionalPos).toBeLessThan(vaalPos);
      expect(exceptionalPos).toBeLessThan(activePos);
      expect(exceptionalPos).toBeLessThan(supportPos);
    });
  });

  it("includes GemTags in TABLES for import", () => {
    expect(Object.values(TableNames)).toContain("GemTags");
  });
});
