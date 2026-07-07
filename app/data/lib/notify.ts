import { diffGaps, type Manifest } from "./manifest.js";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const MAX_CONTENT_LENGTH = 2000;
const MAX_LISTED = 25;

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
  const totalBaseGaps = next.gaps.filter(
    (g) => !g.retired && g.missingBase,
  ).length;

  if (!prev) {
    let content = `**New patch — ${game} ${version}**\nItems: ${next.itemCount}, Uniques: ${next.uniqueCount}`;
    if (totalBaseGaps) {
      content += `\n\n**Base gaps:** ${totalBaseGaps} unique(s) missing base type`;
    }
    await send(content);
    return;
  }

  const { newBase } = diffGaps(prev.gaps, next.gaps);
  if (!newBase.length) return;

  let content = `**Base gaps — ${game} ${version} (${newBase.length} new)**\n`;
  content += formatList(newBase);
  if (totalBaseGaps > newBase.length) {
    content += `\n\n**Total base gaps:** ${totalBaseGaps}`;
  }

  await send(content);
}

function formatList(names: string[]): string {
  const shown = names.slice(0, MAX_LISTED).map((n) => `- ${n}`);
  if (names.length > MAX_LISTED) {
    shown.push(`- … and ${names.length - MAX_LISTED} more`);
  }
  return shown.join("\n");
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
