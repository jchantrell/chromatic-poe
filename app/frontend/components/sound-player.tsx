import { BASE_URL } from "@app/app";
import Tooltip from "@app/components/tooltip";
import { VolumeIcon } from "@app/icons";
import type { Sound } from "@app/lib/sounds";
import { createEffect, onCleanup } from "solid-js";

export default function SoundPlayer(props: {
  sound: Sound | null;
  volume: number;
  size: number;
  highlight?: boolean;
  id?: string | null;
}) {
  let audioRef: HTMLAudioElement | undefined;
  const validAudio =
    props.sound?.data instanceof File ||
    props.sound?.data instanceof Blob ||
    props.sound?.type === "default";

  async function handlePlay() {
    if (audioRef) {
      audioRef.currentTime = 0;
      audioRef.volume = props.volume;
      await audioRef.play();
    }
  }

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

  createEffect(() => {
    const src = getSource(props.sound);

    if (audioRef) {
      audioRef.src = src;
    }

    onCleanup(() => {
      if (
        src &&
        (props.sound?.data instanceof File || props.sound?.data instanceof Blob)
      ) {
        URL.revokeObjectURL(src);
      }
    });
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
