import fs from "node:fs";
import path from "node:path";

const SOUND_PATH = "./packages/assets/static/sounds";

export function extractSounds(filePath: string) {
  const sounds = fs.readdirSync(SOUND_PATH).map((file) => ({
    displayName: file.replace("AlertSound", "").split(".")[0].replace("Sh", ""),
    id: file.replace("AlertSound", "").split(".")[0],
    type: "default",
    path: path.join("static/sounds", file),
  }));
  fs.writeFileSync(filePath, JSON.stringify(sounds, null, " "));
}
