import sharp from "sharp";
import fs from "node:fs";
import { SingleBar, Presets } from "cli-progress";

const FLASK_IMG_HEIGHT = 156;
const GEM_IMG_HEIGHT = 78;
const BATCH_AMOUNT = 20;

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

async function saveImage(baseUrl: string, directory: string, fileName: string) {
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
    `${directory}/${fileName.replaceAll("/", "@")}`,
    buffer,
  );
}

export async function extractImages(
  records: { file: string }[],
  directory: string,
) {
  const baseUrl = `https://web.poecdn.com/image`;
  console.log(`Extracting images for ${records.length} records...`);
  const progressBar = new SingleBar({}, Presets.shades_classic);
  progressBar.start(records.length, 0);

  for (let i = 0; i < records.length; i += BATCH_AMOUNT) {
    const promises = [];
    for (let j = i; j < BATCH_AMOUNT + i; j++) {
      progressBar.update(j);
      const batch = records.slice(j, BATCH_AMOUNT + i);
      for (const entry of batch) {
        if (entry.file && entry.file !== "") {
          const fileName = `${entry.file.replace(".dds", ".png")}`;
          promises.push(saveImage(baseUrl, directory, fileName));
        }
      }
      await Promise.all(promises);
    }
  }
  progressBar.stop();
}
