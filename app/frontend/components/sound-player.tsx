import { BASE_URL } from "@app/app";
import Tooltip from "@app/components/tooltip";
import { VolumeIcon } from "@app/icons";
import type { Sound } from "@app/lib/sounds";
import { onCleanup } from "solid-js";

/** Shared AudioContext — created once on first user interaction. */
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export default function SoundPlayer(props: {
  sound: Sound | null;
  volume: number;
  size: number;
  highlight?: boolean;
  id?: string | null;
}) {
  let activeSource: AudioBufferSourceNode | null = null;
  const validAudio =
    props.sound?.data instanceof File ||
    props.sound?.data instanceof Blob ||
    props.sound?.type === "default";

  /**
   * Fetch the sound as an ArrayBuffer. For File/Blob data we read directly.
   * For default sounds served via path, we fetch asynchronously to avoid
   * blocking the webview on the Tauri asset protocol in production builds.
   */
  async function fetchAudioData(
    sound: Sound | null,
  ): Promise<ArrayBuffer | null> {
    if (sound?.data instanceof File || sound?.data instanceof Blob) {
      return sound.data.arrayBuffer();
    }
    if (sound?.path) {
      const res = await fetch(`${BASE_URL}${sound.path}`);
      return res.arrayBuffer();
    }
    return null;
  }

  /**
   * Play sound using Web Audio API. Bypasses HTMLAudioElement entirely,
   * avoiding GStreamer dependency issues in WebKitGTK/AppImage builds.
   */
  async function handlePlay() {
    // Stop any currently playing instance
    if (activeSource) {
      activeSource.stop();
      activeSource = null;
    }

    const data = await fetchAudioData(props.sound);
    if (!data) return;

    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const buffer = await ctx.decodeAudioData(data);
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = props.volume;
    source.connect(gain).connect(ctx.destination);

    source.onended = () => {
      if (activeSource === source) {
        activeSource = null;
      }
    };

    activeSource = source;
    source.start();
  }

  onCleanup(() => {
    if (activeSource) {
      activeSource.stop();
      activeSource = null;
    }
  });

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
