import Background from "@app/components/background";
import SoundPlayer from "@app/components/sound-player";
import Tooltip from "@app/components/tooltip";
import { RefreshIcon, TrashIcon } from "@app/icons";
import chromatic, { type Sound } from "@app/lib/config";
import { refreshSounds, setSounds, store } from "@app/store";
import { Separator } from "@app/ui/separator";
import {
  Slider,
  SliderFill,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from "@app/ui/slider";
import { platform } from "@tauri-apps/plugin-os";
import { createSignal, For, onMount } from "solid-js";

function SoundFile(props: {
  sound: Sound;
  volume: number;
  handleRemove?: (name: string) => void;
}) {
  return (
    <div class='flex gap-2 justify-between bg-muted border border-accent rounded-md h-10'>
      <div class='flex h-full items-center gap-2'>
        <SoundPlayer
          sound={props.sound}
          volume={props.volume}
          size={10}
          highlight={true}
        />
        <div class='flex items-center'>{props.sound.displayName}</div>
      </div>
      {chromatic.runtime === "web" && props.handleRemove && (
        <div class='flex items-center h-full'>
          <button
            onClick={() => props.handleRemove?.(props.sound.id)}
            type='button'
            class='p-2 hover:bg-primary/10 h-full'
            title='Remove'
          >
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}

export default function SoundManager() {
  const [volume, setVolume] = createSignal(50);
  const [init, setInit] = createSignal(false);

  function handleUpload(e: Event) {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      const files = e.target.files;
      const newSounds: Sound[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const exists = store.sounds.find((sound) => sound.id === file.name);
        if (!exists && file.type.startsWith("audio")) {
          newSounds.push({
            displayName: file.name,
            id: file.name,
            path: `sounds/${file.name}`,
            data: new Blob([file]),
            type: "custom",
          });
          continue;
        }
        if (exists && !(exists?.data instanceof File)) {
          setSounds(
            store.sounds.map((sound) =>
              sound.id === exists.id
                ? { ...sound, data: new Blob([file]), type: "custom" }
                : sound,
            ),
          );
        }
      }

      setSounds(
        [...store.sounds, ...newSounds].sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        ),
      );
    }

    if (chromatic.runtime === "web") {
      chromatic.uploadSounds(store.sounds);
    }
  }

  function handleRemove(id: string) {
    setSounds(store.sounds.filter((sound) => sound.id !== id));
    if (chromatic.runtime === "web") {
      chromatic.uploadSounds(store.sounds);
    }
  }

  function getExampleDir() {
    const os = chromatic.runtime === "desktop" ? platform() : "web";
    if (os === "windows" || os === "web") {
      return `${chromatic.windowsPoeDirectory("C:\\Users\\User", 1)}\\sounds\\my-sound.wav`;
    }
    if (os === "linux") {
      return `${chromatic.linuxPoeDirectory("/home/user", "/home/user", 1)[1]}/sounds/my-sound.wav`;
    }
  }

  onMount(async () => {
    await refreshSounds();
    setInit(true);
  });

  return (
    <Background>
      <div class='flex flex-col items-center size-full p-10'>
        <div class='text-wrap flex flex-col items-center justify-center'>
          <div>
            Chromatic looks for sound files{" "}
            {chromatic.runtime === "desktop" ? "(wav, mp3, ogg) " : ""}
            in the "sounds" folder next to your filter files.
          </div>
        </div>
        <div class='text-neutral-400 italic text-wrap flex flex-col items-center'>
          e.g. {getExampleDir()}
        </div>
        <div class='flex flex-col mb-2 mt-10 w-4/5 h-full'>
          <div class='flex justify-between'>
            <div class='flex items-center'>
              {chromatic.runtime === "web" && (
                <input
                  type='file'
                  id='file'
                  class='hidden'
                  accept='.wav,.mp3,.ogg'
                  multiple
                  onChange={handleUpload}
                />
              )}
              <label
                for='file'
                class='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 w-56 ml-2'
                onMouseDown={async () => {
                  if (
                    chromatic.runtime === "desktop" &&
                    chromatic.config?.poeDirectory
                  ) {
                    await chromatic.openFileExplorer(
                      chromatic.config.poeDirectory,
                    );
                  }
                }}
              >
                {chromatic.runtime === "desktop"
                  ? "Open Sounds Folder"
                  : "Upload Sounds"}
              </label>
              {chromatic.runtime === "desktop" && (
                <Tooltip text='Refresh'>
                  <button
                    onClick={async () => await refreshSounds()}
                    type='button'
                    class='p-2 hover:bg-primary/10'
                  >
                    <RefreshIcon />
                  </button>
                </Tooltip>
              )}
            </div>
            <div class='flex items-end mr-4'>
              <Slider
                value={[volume()]}
                onChange={(v) => setVolume(v[0])}
                getValueLabel={(params) => {
                  return `${params.values[0]}`;
                }}
                class='space-y-3 '
              >
                <div class='flex w-full justify-between'>
                  <SliderLabel>Volume</SliderLabel>
                  <SliderValueLabel />
                </div>
                <div class='flex w-[150px]'>
                  <SliderTrack class='bg-neutral-600'>
                    <SliderFill />
                    <SliderThumb />
                  </SliderTrack>
                </div>
              </Slider>
            </div>
          </div>
          <Separator class='my-3 border-neutral-500' />
          <div class='flex flex-col size-full overflow-y-auto mb-20'>
            <div class='text-lg font-bold'>Custom</div>
            <div class='w-full flex justify-center'>
              {!init() && <span class='text-center'>Loading...</span>}
              {init() && !store.sounds.length && (
                <span class='text-center'>No sounds uploaded.</span>
              )}
            </div>
            <div class='flex flex-col size-full'>
              <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 mt-2 auto-rows-max w-full mb-5'>
                <For each={store.sounds}>
                  {(sound) => (
                    <SoundFile
                      sound={sound}
                      volume={volume() * 0.01}
                      handleRemove={handleRemove}
                    />
                  )}
                </For>
              </div>
              <div class='text-lg font-bold'>Default</div>
              <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 mt-2 auto-rows-min size-full max-h-72'>
                <For each={store.defaultSounds}>
                  {(sound) => (
                    <SoundFile sound={sound} volume={volume() * 0.01} />
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Background>
  );
}
