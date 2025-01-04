import Background from "@app/components/background";
import { createStore } from "solid-js/store";
import { For, onMount } from "solid-js";
import { RefreshIcon, TrashIcon, VolumeIcon } from "@pkgs/icons";
import chromatic from "@app/lib/config";
import { platform } from "@tauri-apps/plugin-os";
import {
  Slider,
  SliderFill,
  SliderThumb,
  SliderTrack,
  SliderLabel,
  SliderValueLabel,
} from "@pkgs/ui/slider";
import { createSignal } from "solid-js";
import Tooltip from "@app/components/tooltip";
import { Separator } from "@pkgs/ui/separator";
import { to } from "@pkgs/lib/utils";
import { toast } from "solid-sonner";

function SoundFile(props: {
  sound: { name: string; data?: Blob; type?: string; path?: string } | File;
  volume: number;
  handleRemove?: (name: string) => void;
}) {
  let audioRef: HTMLAudioElement | undefined;
  const validAudio =
    props.sound instanceof File ||
    props.sound?.data instanceof Blob ||
    props.sound?.path;

  async function handlePlay() {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      audioRef.volume = props.volume;
      await audioRef.play();
    }
  }

  function getSource() {
    if (props.sound instanceof File) {
      return URL.createObjectURL(props.sound);
    }
    if (props.sound?.path) {
      return `/${props.sound.path}`;
    }
    if (props.sound?.data) {
      return URL.createObjectURL(props.sound.data);
    }
    return "";
  }

  return (
    <div class='flex gap-2 justify-between bg-muted border border-accent rounded-md h-10'>
      <div class='flex h-full items-center gap-2'>
        <div class='flex items-center h-full'>
          <Tooltip text='Play Sound'>
            <button
              onClick={async () => await handlePlay()}
              type='button'
              title='Play Sound'
              class={`p-2 hover:bg-primary/10 h-12 ${
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
              <source src={getSource()} type={props.sound.type} />
            </audio>
          )}
        </div>
        <div class='flex items-center'>{props.sound.name.split(".")[0]}</div>
      </div>
      {chromatic.runtime === "web" && props.handleRemove && (
        <div class='flex items-center h-full'>
          <button
            onClick={() => props.handleRemove?.(props.sound.name)}
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
  const [sounds, setSounds] = createStore<File[]>([]);
  const [defaultSounds, setDefaultSounds] = createSignal<
    { name: string; path: string }[]
  >([]);
  const [volume, setVolume] = createSignal(50);
  const [init, setInit] = createSignal(false);

  function handleUpload(e: Event) {
    if (e.target instanceof HTMLInputElement && e.target.files) {
      const files = e.target.files;
      const newSounds: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const exists = sounds.find((sound) => sound.name === file.name);
        if (!exists && file.type.startsWith("audio")) {
          newSounds.push(file);
        }
        if (exists && !(exists instanceof File)) {
          setSounds(sounds.indexOf(exists), file);
        }
      }
      setSounds((prev) =>
        [...prev, ...newSounds].sort((a, b) => a.name.localeCompare(b.name)),
      );
    }

    if (chromatic.runtime === "web") {
      chromatic.uploadSounds(sounds);
    }
  }

  function handleRemove(name: string) {
    setSounds((prev) => prev.filter((sound) => sound.name !== name));
    if (chromatic.runtime === "web") {
      chromatic.uploadSounds(sounds);
    }
  }

  function getExampleDir() {
    const os = chromatic.runtime === "desktop" ? platform() : "web";
    if (os === "windows" || os === "web") {
      return `${chromatic?.config?.poeDirectory ? `${chromatic?.config?.poeDirectory}\\sounds` : `${chromatic.windowsPoeDirectory("C:\\Users\\User")}\\sounds\\my-sound.wav`}`;
    }
    if (os === "linux") {
      return `${chromatic?.config?.poeDirectory ? `${chromatic?.config?.poeDirectory}/sounds/my-sound.wav` : `${chromatic.linuxPoeDirectory("home/user")}/sounds/my-sound.wav`}`;
    }
  }

  async function refreshSounds() {
    console.log("Refreshing sounds...");
    const [err, cachedSounds] = await to(chromatic.getSounds());
    if (err) {
      toast.error("Cannot find sounds folder. Does it exist?");
      return;
    }
    setSounds(cachedSounds.sort((a, b) => a.name.localeCompare(b.name)));
  }

  onMount(async () => {
    await chromatic.init();
    setDefaultSounds(await chromatic.getDefaultSounds());
    await refreshSounds();
    setInit(true);
  });

  return (
    <Background>
      <div class='flex flex-col items-center size-full p-10'>
        <div class='text-wrap flex flex-col items-center justify-center'>
          <div>
            Chromatic looks for sound files in the "sounds" folder next to your
            filter files.
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
                class='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 w-56 ml-2'
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
          <Separator class='my-3 border-neutral-600' />
          <div class='flex flex-col size-full overflow-y-auto mb-20'>
            <div class='text-lg font-bold'>Custom</div>
            <div class='w-full flex justify-center'>
              {!init() && <span class='text-center'>Loading...</span>}
              {init() && !sounds.length && (
                <span class='text-center'>No sounds uploaded.</span>
              )}
            </div>
            <div class='flex flex-col size-full'>
              <div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 mt-2 auto-rows-max w-full mb-5'>
                <For each={sounds}>
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
                <For each={defaultSounds()}>
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
