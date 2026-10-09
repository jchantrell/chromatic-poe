import { describe, expect, it } from "vitest";
import { parsePatchResponse } from "./versions";

function response(url: string): Buffer {
  const header = Buffer.alloc(35);
  header[0] = 0x02;
  header[34] = url.length;
  return Buffer.concat([header, Buffer.from(url, "utf16le")]);
}

describe("parsePatchResponse", () => {
  it("extracts PoE2 version", () => {
    const buf = response("https://patch-poe2.poecdn.com/0.5.5.4.2/");
    expect(parsePatchResponse(buf)).toBe("0.5.5.4.2");
  });

  it("extracts PoE1 version", () => {
    const buf = response("https://patch.poecdn.com/3.29.3.3/");
    expect(parsePatchResponse(buf)).toBe("3.29.3.3");
  });

  it("returns null while response is incomplete", () => {
    const buf = response("https://patch.poecdn.com/3.29.3.3/");
    expect(parsePatchResponse(buf.subarray(0, 50))).toBeNull();
  });

  it("returns null for unexpected opcode", () => {
    const buf = response("https://patch.poecdn.com/3.29.3.3/");
    buf[0] = 0x01;
    expect(parsePatchResponse(buf)).toBeNull();
  });

  it("throws when URL has no valid version", () => {
    const buf = response("https://patch.poecdn.com/error/");
    expect(() => parsePatchResponse(buf)).toThrow(/Unexpected patch server/);
  });
});
