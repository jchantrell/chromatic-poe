import { describe, expect, it } from "vitest";
import { decodeEntities } from "./html";

describe("decodeEntities", () => {
  it("decodes the numeric apostrophe cargo returns", () => {
    expect(decodeEntities("Abberath&#039;s Hooves")).toBe("Abberath's Hooves");
    expect(decodeEntities("Goat&#039;s Horn")).toBe("Goat's Horn");
  });

  it("decodes hex and named entities", () => {
    expect(decodeEntities("Fairgraves&#x27; Tricorne")).toBe(
      "Fairgraves' Tricorne",
    );
    expect(decodeEntities("Cat O&apos; Nine Tails")).toBe("Cat O' Nine Tails");
    expect(decodeEntities("&lt;tag&gt; &quot;quoted&quot;")).toBe(
      '<tag> "quoted"',
    );
  });

  it("decodes ampersands last so entities are not double decoded", () => {
    expect(decodeEntities("&amp;#039;")).toBe("&#039;");
  });

  it("leaves unescaped values untouched", () => {
    expect(decodeEntities("Abberath's Hooves")).toBe("Abberath's Hooves");
    expect(decodeEntities("Blutschläger")).toBe("Blutschläger");
    expect(decodeEntities("")).toBe("");
  });
});
