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
  let audioRef: HTMLAudioElement | undefined;
  let objectUrl: string | null = null;
  const validAudio =
    props.sound?.data instanceof File ||
    props.sound?.data instanceof Blob ||
    props.sound?.type === "default";

  function getSource(sound: Sound | null) {
    if (sound?.data instanceof File) {
      return URL.createObjectURL(sound.data);
    }
    if (sound?.data instanceof Blob) {
      return URL.createObjectURL(sound.data);
    }
    if (sound?.path) {
      return `${BASE_URL}${sound.path}`;
    }
    return "";
  }

  /**
   * Load audio source on demand and play. Avoids eagerly loading all audio
   * elements which overwhelms the Tauri asset protocol in production builds.
   */
  async function handlePlay() {
    if (!audioRef) return;

    const src = getSource(props.sound);
    if (!src) return;

    // Revoke previous object URL if any
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    // Track object URLs for cleanup
    if (
      props.sound?.data instanceof File ||
      props.sound?.data instanceof Blob
    ) {
      objectUrl = src;
    }

    audioRef.src = src;
    audioRef.volume = props.volume;
    audioRef.currentTime = 0;
    await audioRef.play();
  }

  onCleanup(() => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
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
      {validAudio && (
        <audio ref={audioRef}>
          <track kind='captions' />
        </audio>
      )}
    </div>
  );
}
