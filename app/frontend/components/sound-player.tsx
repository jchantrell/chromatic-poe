import { BASE_URL } from "@app/app";
import Tooltip from "@app/components/tooltip";
import { VolumeIcon } from "@app/icons";
import type { Sound } from "@app/lib/sounds";
import { onCleanup } from "solid-js";

export default function SoundPlayer(props: {
  sound: Sound | null;
  volume: number;
  size: number;
  highlight?: boolean;
  id?: string | null;
}) {
  let audio: HTMLAudioElement | null = null;
  let objectUrl: string | null = null;
  const validAudio =
    props.sound?.data instanceof File ||
    props.sound?.data instanceof Blob ||
    props.sound?.type === "default";

  function cleanup() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audio = null;
    }
  }

  /**
   * Resolve a blob URL for the sound. For File/Blob data this is instant.
   * For default sounds served via path, we fetch asynchronously to avoid
   * blocking the webview on the Tauri asset protocol in production builds.
   */
  async function resolveBlobUrl(sound: Sound | null): Promise<string> {
    if (sound?.data instanceof File || sound?.data instanceof Blob) {
      return URL.createObjectURL(sound.data);
    }
    if (sound?.path) {
      const res = await fetch(`${BASE_URL}${sound.path}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
    return "";
  }

  /**
   * Create audio element on demand and play. Avoids rendering srcless
   * <audio> elements which trigger GLib errors in WebKitGTK on Linux.
   */
  async function handlePlay() {
    cleanup();

    const src = await resolveBlobUrl(props.sound);
    if (!src) return;

    objectUrl = src;
    audio = new Audio(src);
    audio.volume = props.volume;
    await audio.play();
  }

  onCleanup(cleanup);

  return (
    <div class='flex items-center h-full'>
      <Tooltip text='Play Sound'>
        <button
          onClick={async () => await handlePlay()}
          type='button'
          title={`Play Sound ${props.sound?.id}`}
          class={`p-2 cursor-pointer ${props.highlight ? "hover:bg-primary/10" : ""} w-${props.size} h-${props.size} ${
            validAudio ? "" : "text-primary/25"
          }`}
          disabled={!validAudio}
        >
          <VolumeIcon />
        </button>
      </Tooltip>
    </div>
  );
}
