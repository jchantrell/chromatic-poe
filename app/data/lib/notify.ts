const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const MAX_CONTENT_LENGTH = 2000;

interface GapEntry {
  name: string;
  missingBase: boolean;
  missingPoeladder: boolean;
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
  let content = `**Data release** — ${game} ${version}\nItems: ${itemCount}, Uniques: ${uniqueCount}\n`;

  if (gaps.length) {
    const missingBases = gaps.filter((g) => g.missingBase);
    const missingLadder = gaps.filter((g) => g.missingPoeladder);

    if (missingBases.length) {
      content += `\n**Missing base types (${missingBases.length}):**\n`;
      content += missingBases.map((g) => `- ${g.name}`).join("\n");
    }
    if (missingLadder.length) {
      content += `\n**Missing poeladder category (${missingLadder.length}):**\n`;
      content += missingLadder.map((g) => `- ${g.name}`).join("\n");
    }
  } else {
    content += "All uniques fully enriched.";
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
