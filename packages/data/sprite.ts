// MIT License
//
// Copyright (c) 2020 Alexander Drozdov
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// Implementation adapted from https://github.com/SnosMe/poe-dat-viewer/lib/src/sprites/layout-parser.ts

export interface SpriteImage {
  name: string;
  spritePath: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export function parse(text: string) {
  return text
    .trim()
    .split("\n")
    .map<SpriteImage>((line) => {
      const separated = line.match(
        /^"([^"]+)" "([^"]+)" ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+)$/,
      )!;
      const top = Number(separated[3]);
      const left = Number(separated[4]);
      return {
        name: separated[1],
        spritePath: separated[2],
        top: top,
        left: left,
        width: Number(separated[5]) - top + 1,
        height: Number(separated[6]) - left + 1,
      };
    });
}

export function parseFile(file: Uint8Array) {
  const decoder = new TextDecoder("utf-16le");
  return parse(decoder.decode(file));
}
