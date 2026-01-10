import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export async function proxyFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  if (isTauri()) {
    return await tauriFetch(url, init);
  }

  const proxyUrl = `${import.meta.env.VITE_PROXY_API_HOST}?url=${encodeURIComponent(url)}`;
  return await fetch(proxyUrl, init);
}
