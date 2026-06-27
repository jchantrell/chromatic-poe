import { diffGaps, type Manifest } from "./manifest.js";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const MAX_CONTENT_LENGTH = 2000;

export async function notifyFailure(
  game: string,
  version: string,
  error: string,
): Promise<void> {
  const runUrl =
    process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : "";

  let content = `**PIPELINE FAILURE** — ${game} ${version}\n${error}`;
  if (runUrl) content += `\n${runUrl}`;

  await send(content);
}

export async function notifyChange(
  game: string,
  version: string,
  prev: Manifest | null,
  next: Manifest,
): Promise<void> {
  const header = prev ? "Data updated" : "New patch";
  let content = `**${header} — ${game} ${version}**\nItems: ${next.itemCount}, Uniques: ${next.uniqueCount}`;

  if (prev) {
    const { filledBase, newGaps } = diffGaps(prev.gaps, next.gaps);
    if (filledBase.length) {
      content += `\n\n**Base types filled (${filledBase.length}):**\n`;
      content += filledBase.map((n) => `- ${n}`).join("\n");
    }
    if (newGaps.length) {
      content += `\n\n**New gaps (${newGaps.length}):**\n`;
      content += newGaps
        .map((g) => {
          const issues = [];
          if (g.missingBase) issues.push("base");
          if (g.missingPoeladder) issues.push("poeladder");
          return `- ${g.name} (${issues.join(", ")})`;
        })
        .join("\n");
    }
    if (!filledBase.length && !newGaps.length) {
      content += "\n\n(core data changed)";
    }
  }

  const active = next.gaps.filter((g) => !g.retired);
  const remainingBase = active.filter((g) => g.missingBase).length;
  const remainingLadder = active.filter((g) => g.missingPoeladder).length;
  if (remainingBase || remainingLadder) {
    content += `\n\n**Remaining gaps:** ${remainingBase} base, ${remainingLadder} poeladder`;
  } else {
    content += "\n\nAll drop-enabled uniques fully enriched.";
  }

  await send(content);
}

async function send(content: string): Promise<void> {
  const truncated =
    content.length > MAX_CONTENT_LENGTH
      ? content.slice(0, MAX_CONTENT_LENGTH - 20) + "\n... (truncated)"
      : content;

  if (!DISCORD_WEBHOOK_URL) {
    console.log(truncated);
    return;
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: truncated }),
    });
  } catch (err) {
    console.error("Failed to send Discord notification:", err);
  }
}
