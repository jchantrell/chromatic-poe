import sharp from "sharp";
import fs from "node:fs";

const FLASK_IMG_HEIGHT = 156;
const GEM_IMG_HEIGHT = 78;
const BATCH_AMOUNT = 20;
const IMAGE_DIR = "./packages/assets/images";

async function fixIcon(buffer: Buffer, height: number): Promise<Buffer> {
  const img = sharp(buffer);
  const meta = await img.clone().metadata();
  if (meta.width !== 234) return buffer;
  const one = await img
    .clone()
    .extract({ left: 0, top: 0, width: 78, height })
    .toBuffer();
  const two = await img
    .clone()
    .extract({ left: 78, top: 0, width: 78, height })
    .toBuffer();
  const three = img.clone().extract({ left: 156, top: 0, width: 78, height });
  return three.composite([{ input: two }, { input: one }]).toBuffer();
}

async function saveImage(baseUrl: string, fileName: string) {
  const request = await fetch(`${baseUrl}/${fileName}`);
  const arrayBuffer = await request.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer);

  const split = fileName.split("/");
  const type = split[2];
  const subtype = split[3];

  if (type === "Flasks" && !split[split.length - 1].endsWith("Sap.png")) {
    buffer = await fixIcon(buffer, FLASK_IMG_HEIGHT);
  }
  if ((type === "Gems" && subtype !== "Support") || subtype === "VaalGems") {
    buffer = await fixIcon(buffer, GEM_IMG_HEIGHT);
  }

  return fs.writeFileSync(
    `${IMAGE_DIR}/${fileName.replaceAll("/", "@")}`,
    buffer,
  );
}

async function main() {
  const startTime = performance.now();
  const baseUrl = "https://web.poecdn.com/image";
  const entries = JSON.parse(
    fs.readFileSync("./packages/data/raw.json", "utf8"),
  );

  for (let i = 0; i < entries.length; i += BATCH_AMOUNT) {
    const promises = [];
    for (let j = i; j < BATCH_AMOUNT + i; j++) {
      const batch = entries.slice(j, BATCH_AMOUNT + i);
      for (const entry of batch) {
        if (entry.file) {
          const fileName = `${entry.file.replace(".dds", ".png")}`;
          promises.push(saveImage(baseUrl, fileName));
        }
      }
      await Promise.all(promises);
    }
  }
  const endTime = performance.now();
  console.log(`Finished in ${Math.abs(endTime - startTime) / 1000}`);
}

main();
