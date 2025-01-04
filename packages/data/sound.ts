import fs from "node:fs";
import path from "node:path";

const SOUND_PATH = "./packages/assets/static/sounds";

export function extractSounds(filePath: string) {
  const sounds = fs.readdirSync(SOUND_PATH).map((file) => ({
    name: file.replace("AlertSound", "").replace("Sh", ""),
    path: path.join("static/sounds", file),
  }));
  fs.writeFileSync(filePath, JSON.stringify(sounds, null, " "));
}
