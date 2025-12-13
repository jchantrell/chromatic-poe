// @ts-ignore
import dxt from "dxt-js";
import { type DBSchema, openDB } from "idb";
import type { BundleManager } from "./bundle";
import { parseDds } from "./dds";

interface ArtCacheSchema extends DBSchema {
  images: {
    key: string;
    value: Blob;
  };
}

export class ArtManager {
  private dbPromise = openDB<ArtCacheSchema>("poe-art-cache", 1, {
    upgrade(db) {
      db.createObjectStore("images");
    },
  });

  private urlCache = new Map<string, string>();

  constructor(private loader: BundleManager) {}

  async ensureCached(
    patch: string,
    items: { name: string; path: string }[],
  ): Promise<void> {
    if (!this.loader.index) {
      await this.loader.init(patch);
    }
    const db = await this.dbPromise;
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
    const gameVersion = patch.startsWith("3") ? 1 : 2;
    const cacheKey = `${gameVersion}/${name}`;

    if (this.urlCache.has(cacheKey)) {
      return this.urlCache.get(cacheKey);
    }

    const db = await this.dbPromise;
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
    _gameVersion: 1 | 2,
  ): Promise<Blob | null> {
    try {
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
      } else if (format === "rgba8unorm") {
        const offset = dds.images[0].offset;
        const length = dds.images[0].length;
        rgba = new Uint8Array(buffer.buffer, offset, length);
      } else {
        console.warn(`Unsupported DDS format: ${format} for ${filename}`);
        return null;
      }

      const imageData = new ImageData(
        new Uint8ClampedArray(rgba),
        width,
        height,
      );

      let needsFix = false;
      let fixWidth = 0;

      const aspect = width / height;
      const isStrip3 = aspect > 2.8 && aspect < 3.2;
      const isStrip1_5 = aspect > 1.4 && aspect < 1.6;

      if (isStrip3 || isStrip1_5) {
        const pathLower = filename.toLowerCase();
        const isFlask = pathLower.includes("flask");
        const isGem =
          pathLower.includes("gem") && !pathLower.includes("support");
        const isSap = filename.endsWith("Sap.dds");

        if (!isSap) {
          if (isStrip3 && (isGem || isFlask)) {
            needsFix = true;
            fixWidth = Math.round(width / 3);
          } else if (isStrip1_5 && isFlask) {
            needsFix = true;
            fixWidth = Math.round(width / 3);
          }
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      if (needsFix) {
        canvas.width = width;
        canvas.height = height;
        ctx.putImageData(imageData, 0, 0);
        ctx.drawImage(
          canvas,
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
          canvas,
          fixWidth,
          0,
          fixWidth,
          height,
          0,
          0,
          fixWidth,
          height,
        );
        ctx.drawImage(canvas, 0, 0, fixWidth, height, 0, 0, fixWidth, height);
      } else {
        ctx.putImageData(imageData, 0, 0);
      }

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
    } catch (e) {
      console.error(`Error converting DDS ${filename}:`, e);
      return null;
    }
  }

  async clearCache() {
    const db = await this.dbPromise;
    await db.clear("images");
  }
}
