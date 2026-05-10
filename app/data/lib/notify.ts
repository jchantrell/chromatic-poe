const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const MAX_CONTENT_LENGTH = 2000;

interface GapEntry {
  name: string;
  missingBase: boolean;
  missingPoeladder: boolean;
  retired: boolean;
}

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

export async function notifySuccess(
  game: string,
  version: string,
  itemCount: number,
  uniqueCount: number,
  gaps: GapEntry[],
): Promise<void> {
  const active = gaps.filter((g) => !g.retired);
  const retiredCount = gaps.length - active.length;

  let content = `**Data release** — ${game} ${version}\nItems: ${itemCount}, Uniques: ${uniqueCount}\n`;

  const activeMissingBases = active.filter((g) => g.missingBase);
  const activeMissingLadder = active.filter((g) => g.missingPoeladder);

  if (activeMissingBases.length) {
    content += `\n**Missing base types (${activeMissingBases.length}):**\n`;
    content += activeMissingBases.map((g) => `- ${g.name}`).join("\n");
  }
  if (activeMissingLadder.length) {
    content += `\n**Missing poeladder category (${activeMissingLadder.length}):**\n`;
    content += activeMissingLadder.map((g) => `- ${g.name}`).join("\n");
  }

  if (!activeMissingBases.length && !activeMissingLadder.length) {
    content += "All drop-enabled uniques fully enriched.";
  }

  if (retiredCount) {
    content += `\n- ${retiredCount} retired uniques`;
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
