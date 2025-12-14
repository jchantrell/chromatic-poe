// @ts-ignore
import dxt from "dxt-js";
import { decodeBC7 } from "./bc7";
import type { BundleManager } from "./bundle";
import { parseDds } from "./dds";
import type { IDBManager } from "./idb";

const TINCTURE_SUFFIX = [
  "UniquePrismatic.dds",
  "UniqueIronwood.dds",
  "UniqueAshbark.dds",
  "UniqueOakbranch.dds",
  "UniqueSporebloom.dds",
];

export class ArtManager {
  private urlCache = new Map<string, string>();

  constructor(
    private loader: BundleManager,
    private db: IDBManager,
  ) {}

  async ensureCached(
    patch: string,
    items: { name: string; path: string }[],
  ): Promise<void> {
    if (!this.loader.index) {
      await this.loader.init(patch);
    }
    const db = await this.db.getInstance();
    const missing: { name: string; path: string }[] = [];

    const gameVersion = patch.startsWith("3") ? 1 : 2;

    for (const item of items) {
      if (!item.path) continue;

      const cacheKey = `${gameVersion}/${item.name}`;

      if (this.urlCache.has(cacheKey)) {
        continue;
      }

      const blob = await db.get("images", cacheKey);
      if (blob) {
        const url = URL.createObjectURL(blob);
        this.urlCache.set(cacheKey, url);
      } else {
        missing.push(item);
      }
    }

    if (missing.length > 0) {
      console.log(`Fetching ${missing.length} new art files...`);
      for (const item of missing) {
        try {
          const cacheKey = `${gameVersion}/${item.name}`;
          const ddsBuffer = await this.loader.getFileContents(item.path);
          const pngBlob = await this.convertDDSToPNG(
            ddsBuffer,
            item.path,
            gameVersion,
          );

          if (pngBlob) {
            await db.put("images", pngBlob, cacheKey);
            const url = URL.createObjectURL(pngBlob);
            this.urlCache.set(cacheKey, url);
          }
        } catch (e) {
          console.warn(`Failed to process art: ${item.path}`, e);
        }
      }
    }
  }

  async getCached(patch: string, name: string): Promise<string | undefined> {
    if (!patch) {
      return;
    }
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    const cacheKey = `${gameVersion}/${name}`;

    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey);
    }

    const db = await this.db.getInstance();
    const blob = await db.get("images", cacheKey);
    if (blob) {
      const url = URL.createObjectURL(blob);
      this.urlCache.set(cacheKey, url);
      return url;
    }

    return undefined;
  }

  private async convertDDSToPNG(
    buffer: Uint8Array,
    filename: string,
    gameVersion: 1 | 2,
  ): Promise<Blob | null> {
    const dds = parseDds(buffer.buffer);
    const width = dds.shape[0];
    const height = dds.shape[1];
    const format = dds.format; // 'dxt1', 'dxt3', 'dxt5', 'rgba8unorm', etc

    let rgba: Uint8Array;

    if (format === "dxt1") {
      rgba = dxt.decompress(dds.images[0], width, height, dxt.flags.DXT1);
    } else if (format === "dxt3") {
      rgba = dxt.decompress(dds.images[0], width, height, dxt.flags.DXT3);
    } else if (format === "dxt5") {
      rgba = dxt.decompress(dds.images[0], width, height, dxt.flags.DXT5);
    } else if (format === "bc7") {
      rgba = decodeBC7(
        new Uint8Array(buffer.buffer, dds.images[0].offset),
        width,
        height,
      );
    } else if (format === "rgba8unorm") {
      const offset = dds.images[0].offset;
      const length = dds.images[0].length;
      rgba = new Uint8Array(buffer.buffer, offset, length);
    } else {
      console.warn(`Unsupported DDS format: ${format} for ${filename}`);
      return null;
    }

    const image = new ImageData(new Uint8ClampedArray(rgba), width, height);

    let needsFix = false;
    let fixWidth = 0;

    const split = filename.split("/");
    const type = split[2];
    const subtype = split[3];
    const name = split[split.length - 1];

    if (
      type === "Flasks" &&
      !TINCTURE_SUFFIX.includes(name) &&
      !name.endsWith("Sap.dds")
    ) {
      if (gameVersion === 1) {
        needsFix = true;
        fixWidth = Math.round(width / 3);
      }
      if (gameVersion === 2) {
        needsFix = true;
        fixWidth = Math.round(width / 4);
      }
    }

    if (
      ((type === "Gems" && subtype !== "Support") || subtype === "VaalGems") &&
      gameVersion === 1
    ) {
      needsFix = true;
      fixWidth = Math.round(width / 3);
    }

    let tarCanvas: OffscreenCanvas | HTMLCanvasElement;
    let srcCanvas: OffscreenCanvas | HTMLCanvasElement;

    if (typeof OffscreenCanvas !== "undefined") {
      tarCanvas = new OffscreenCanvas(needsFix ? fixWidth : width, height);
      srcCanvas = new OffscreenCanvas(width, height);
    } else {
      tarCanvas = document.createElement("canvas");
      tarCanvas.width = needsFix ? fixWidth : width;
      tarCanvas.height = height;
      srcCanvas = document.createElement("canvas");
      srcCanvas.width = width;
      srcCanvas.height = height;
    }

    const ctx = tarCanvas.getContext("2d");
    if (!ctx) return null;
    const srcCtx = srcCanvas.getContext("2d");
    if (!srcCtx) return null;

    if (needsFix) {
      srcCtx.putImageData(image, 0, 0);
      ctx.drawImage(
        srcCanvas,
        fixWidth * 2,
        0,
        fixWidth,
        height,
        0,
        0,
        fixWidth,
        height,
      );
      ctx.drawImage(
        srcCanvas,
        fixWidth,
        0,
        fixWidth,
        height,
        0,
        0,
        fixWidth,
        height,
      );
      ctx.drawImage(srcCanvas, 0, 0, fixWidth, height, 0, 0, fixWidth, height);
    } else {
      ctx.putImageData(image, 0, 0);
    }

    if (tarCanvas instanceof OffscreenCanvas) {
      return await tarCanvas.convertToBlob({ type: "image/png" });
    }

    return new Promise<Blob | null>((resolve) => {
      tarCanvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async clearCache() {
    const db = await this.db.getInstance();
    await db.clear("images");
  }
}
