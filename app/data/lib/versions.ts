export async function fetchPoeVersions(): Promise<{
  poe1: string;
  poe2: string;
}> {
  const response = await fetch("https://poe-versions.obsoleet.org/");
  if (!response.ok) {
    throw new Error(
      `Failed to fetch PoE versions: ${response.status} ${response.statusText}`,
    );
  }
  const data = await response.json();
  return {
    poe1: data.poe,
    poe2: data.poe2,
  };
}
