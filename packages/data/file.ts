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
// Implementation adapted from https://github.com/SnosMe/poe-dat-viewer/lib/src/cli/export-files.ts

import { parseFile as parseSpriteIndex, type SpriteImage } from "./sprite";
import { spawn } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { FileLoader } from "./loader";

const SPRITE_LISTS = [
  {
    path: "Art/UIImages1.txt",
    namePrefix: "Art/2DArt/UIImages/",
    spritePrefix: "Art/Textures/Interface/2D/",
  },
  {
    path: "Art/UIDivinationImages.txt",
    namePrefix: "Art/2DItems/Divination/Images/",
    spritePrefix: "Art/Textures/Interface/2D/DivinationCards/",
  },
  {
    path: "Art/UIShopImages.txt",
    namePrefix: "Art/2DArt/Shop/",
    spritePrefix: "Art/Textures/Interface/2D/Shop/",
  },
];

function isInsideSprite(path: string) {
  return SPRITE_LISTS.some((list) => path.startsWith(list.namePrefix));
}

export async function exportFiles(
  filesToExport: string[],
  outDir: string,
  loader: FileLoader,
) {
  console.log(`Exporting ${filesToExport.length} files...`);
  // await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  // export from sprites
  {
    const PARSED_LISTS: SpriteImage[][] = [];
    for (const sprite of SPRITE_LISTS) {
      const file = await loader.getFileContents(sprite.path);
      PARSED_LISTS.push(parseSpriteIndex(file));
    }

    const images = filesToExport.filter(isInsideSprite).map((path) => {
      const idx = SPRITE_LISTS.findIndex((list) =>
        path.startsWith(list.namePrefix),
      );
      return PARSED_LISTS[idx].find((img) => img.name === path);
    });

    const bySprite = images.reduce<
      Array<{
        path: string;
        images: SpriteImage[];
      }>
    >((bySprite, img) => {
      const found = bySprite.find((sprite) => sprite.path === img.spritePath);
      if (found) {
        found.images.push(img);
      } else {
        bySprite.push({ path: img.spritePath, images: [img] });
      }
      return bySprite;
    }, []);

    for (const sprite of bySprite) {
      const ddsFile = await loader.getFileContents(sprite.path);
      for (const image of sprite.images) {
        await imagemagickConvertDDS(
          ddsFile,
          image,
          path.join(outDir, `${image.name.replace(/\//g, "@")}.png`),
        );
      }
    }
  }

  // export regular files
  {
    const files = filesToExport.filter((path) => !isInsideSprite(path));
    for (const filePath of files) {
      if (filePath.endsWith(".dds")) {
        await imagemagickConvertDDS(
          await loader.getFileContents(filePath),
          null,
          path.join(
            outDir,
            filePath.replace(/\//g, "@").replace(/\.dds$/, ".png"),
          ),
        );
      } else {
        await fs.writeFile(
          path.join(outDir, filePath.replace(/\//g, "@")),
          await loader.getFileContents(filePath),
        );
      }
    }
  }
}

function imagemagickConvertDDS(
  ddsFile: Uint8Array,
  crop: { width: number; height: number; top: number; left: number } | null,
  outName: string,
) {
  const cropArg = crop
    ? `${crop.width}x${crop.height}+${crop.top}+${crop.left}`
    : "100%";
  return new Promise<void>((resolve, reject) => {
    const magick = spawn("magick", ["dds:-", "-crop", cropArg, outName], {
      stdio: ["pipe", "ignore", "ignore"],
    });
    magick.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`imagemagick exited with code ${code}.`));
      }
    });
    magick.stdin.write(ddsFile);
    magick.stdin.end();
  });
}
