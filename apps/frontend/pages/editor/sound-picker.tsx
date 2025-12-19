import SoundPlayer from "@app/components/sound-player";
import Tooltip from "@app/components/tooltip";
import {
  setSoundEnabled,
  setSoundPath,
  setSoundVolume,
} from "@app/lib/commands";
import type { Filter } from "@app/lib/filter";
import type { Sound } from "@app/lib/sounds";
import { refreshSounds, store } from "@app/store";
import { Checkbox } from "@app/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxSection,
  ComboboxTrigger,
} from "@app/ui/combo-box";
import { Label } from "@app/ui/label";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@app/ui/slider";
import { createMemo, createSignal, on, onMount } from "solid-js";
import { createStore } from "solid-js/store";

interface Category {
  label: string;
  options: Sound[];
}

export default function SoundPicker() {
  if (!store.activeRule || !store.filter) {
    return "";
  }
  const [sounds, setSounds] = createStore<Category[]>([]);
  const [active, setActive] = createSignal(
    store.activeRule?.actions.sound?.enabled || false,
  );
  const [volume, setVolume] = createSignal(
    store.activeRule?.actions.sound?.volume || 100,
  );
  const [path, setPath] = createSignal<Sound | null>(
    findSound(store.activeRule?.actions.sound?.path) ?? null,
  );

  const [sound, setSound] = createSignal<Sound | null>(null);

  function handleActive(enabled: boolean) {
    setActive(enabled);
  }

  function handleVolume(value: number) {
    setVolume(value);
  }

  function setSoundRef() {
    if (path()?.type === "default") {
      setSound(store.defaultSounds.find((s) => s.id === path()?.id) || null);
    }
    if (path()?.type === "cached") {
      setSound(null);
    }
    if (path()?.type === "custom") {
      setSound(store.sounds.find((s) => s.id === path()?.id) || null);
    }
  }

  function findSound(
    path:
      | {
          value: string;
          path?: string;
          type: "custom" | "default" | "cached";
        }
      | undefined,
  ): Sound | undefined {
    if (!path) {
      return undefined;
    }
    return sounds
      .flatMap((s) => s.options)
      .find((o) => {
        if (path.type === "default") {
          return o.id === path.value && o.type === path.type;
        }
        return o.id === path.value && o.type === path.type;
      });
  }

  createMemo(
    on(active, () => {
      if (
        store.activeRule?.actions?.sound &&
        store.activeRule.actions.sound.enabled !== active()
      ) {
        setSoundEnabled(store.filter as Filter, store.activeRule, active());
      }
    }),
  );

  createMemo(
    on(path, () => {
      if (
        store.activeRule?.actions &&
        path()?.path &&
        path()?.type &&
        path()?.id
      ) {
        setSoundPath(store.filter as Filter, store.activeRule, {
          value: path()?.id as string,
          path: path()?.path as string,
          type: path()?.type as "custom" | "default",
        });
      }
      setSoundRef();
    }),
  );
  createMemo(
    on(volume, () => {
      if (
        store.activeRule?.actions?.sound?.path &&
        store.activeRule.actions.sound.volume !== volume()
      ) {
        setSoundVolume(store.filter as Filter, store.activeRule, volume());
      }
    }),
  );

  createMemo(async () => {
    if (!store.activeRule?.actions?.sound?.enabled) {
      setPath(null);
      setActive(false);
      setVolume(100);
      return;
    }
    if (store.activeRule?.actions.sound.enabled) {
      const path = findSound(store.activeRule.actions?.sound?.path);
      if (path) {
        setPath(path);
      } else {
        setPath(null);
      }
      setActive(store.activeRule.actions.sound?.enabled || false);
      setVolume(store.activeRule.actions.sound?.volume || 100);
    }
  });

  onMount(async () => {
    await refreshSounds();
    setSounds([
      {
        label: "Custom",
        options: store.sounds,
      },
      {
        label: "Default",
        options: store.defaultSounds,
      },
    ]);
  });

  return (
    <>
      <div class='flex text-nowrap items-center h-6'>
        <Label class='w-[94px]' for='beam'>
          Alert Sound
        </Label>
        <Checkbox id='beam' onChange={handleActive} checked={active()} />
        <div class='flex grow-0'>
          {active() && (
            <Tooltip text='Edit sound file'>
              <Combobox<Sound, Category>
                options={sounds}
                optionValue='id'
                optionTextValue='displayName'
                optionLabel='displayName'
                optionGroupChildren='options'
                placeholder='Select sound…'
                onChange={setPath}
                value={path()}
                class='overflow-y-auto'
                itemComponent={(props) => (
                  <ComboboxItem item={props.item}>
                    <ComboboxItemLabel>
                      {props.item.rawValue.displayName}
                    </ComboboxItemLabel>
                    <ComboboxItemIndicator />
                  </ComboboxItem>
                )}
                sectionComponent={(props) => (
                  <ComboboxSection>
                    {props.section.rawValue.label}
                  </ComboboxSection>
                )}
              >
                <ComboboxControl aria-label='Sound'>
                  <div class='h-10 w-10 flex items-center justify-center'>
                    {sound() ? (
                      <SoundPlayer
                        sound={sound()}
                        volume={volume() / 300}
                        size={10}
                      />
                    ) : (
                      <SoundPlayer
                        sound={null}
                        volume={volume() / 300}
                        size={10}
                      />
                    )}
                  </div>
                  <ComboboxInput />
                  <ComboboxTrigger />
                </ComboboxControl>
                <ComboboxContent />
              </Combobox>
            </Tooltip>
          )}
        </div>
      </div>
      {active() && (
        <div class='flex items-center gap-1.5'>
          <Label class='w-[87px]'>Volume</Label>
          <div class='w-5'>{volume()}</div>
          <Slider
            class='w-[150px] ml-2'
            minValue={0}
            maxValue={300}
            step={1}
            value={[volume()]}
            onChange={(v) => handleVolume(v[0])}
          >
            <SliderTrack class='bg-accent'>
              <SliderFill class='bg-neutral-400' />
              <SliderThumb class='size-4' />
            </SliderTrack>
          </Slider>
        </div>
      )}
    </>
  );
}
