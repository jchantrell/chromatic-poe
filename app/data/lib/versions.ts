import { connect } from "node:net";

const PATCH_SERVERS = {
  poe1: { host: "patch.pathofexile.com", port: 12995 },
  poe2: { host: "patch.pathofexile2.com", port: 13060 },
} as const;

const PATCH_PATTERN = /^\d+(\.\d+){1,4}$/;
const TIMEOUT_MS = 10_000;
const URL_LENGTH_OFFSET = 34;
const URL_OFFSET = 35;

export function parsePatchResponse(buf: Buffer): string | null {
  if (buf.length <= URL_LENGTH_OFFSET || buf[0] !== 0x02) return null;
  const end = URL_OFFSET + buf[URL_LENGTH_OFFSET] * 2;
  if (buf.length < end) return null;
  const url = buf.subarray(URL_OFFSET, end).toString("utf16le");
  const version = url.match(/\/([^/]+)\/?$/)?.[1];
  if (!version || !PATCH_PATTERN.test(version)) {
    throw new Error(`Unexpected patch server URL: ${url}`);
  }
  return version;
}

function queryPatchServer(host: string, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, host, () => socket.write(Buffer.from([1, 7])));
    let buf = Buffer.alloc(0);
    const fail = (err: Error) => {
      socket.destroy();
      reject(new Error(`Patch server ${host}:${port}: ${err.message}`));
    };
    socket.setTimeout(TIMEOUT_MS, () => fail(new Error("timed out")));
    socket.on("error", fail);
    socket.on("close", () => fail(new Error("closed before response")));
    socket.on("data", (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      try {
        const version = parsePatchResponse(buf);
        if (!version) return;
        socket.removeAllListeners("close");
        socket.destroy();
        resolve(version);
      } catch (err) {
        fail(err as Error);
      }
    });
  });
}

export async function fetchPoeVersions(): Promise<{
  poe1: string;
  poe2: string;
}> {
  const [poe1, poe2] = await Promise.all([
    queryPatchServer(PATCH_SERVERS.poe1.host, PATCH_SERVERS.poe1.port),
    queryPatchServer(PATCH_SERVERS.poe2.host, PATCH_SERVERS.poe2.port),
  ]);
  return { poe1, poe2 };
}

if (import.meta.main) {
  console.log(JSON.stringify(await fetchPoeVersions()));
}
