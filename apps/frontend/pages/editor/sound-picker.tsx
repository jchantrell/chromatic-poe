import { createEffect, createSignal, on, onMount } from "solid-js";
import { refreshSounds, store } from "@app/store";
import { setSoundEnabled, setSoundPath, setSoundVolume } from "@app/lib/filter";
import { Checkbox } from "@pkgs/ui/checkbox";
import { Label } from "@pkgs/ui/label";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@pkgs/ui/slider";
import Tooltip from "@app/components/tooltip";
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
} from "@pkgs/ui/combo-box";
import { chromatic, type Sound } from "@app/lib/config";
import { createStore } from "solid-js/store";
import { SoundPlayer } from "../sound";

interface Category {
  label: string;
  options: Sound[];
}

export default function SoundPicker() {
  const [sounds, setSounds] = createStore<Category[]>([]);
  const [active, setActive] = createSignal(
    store.activeRule?.actions.sound?.enabled || false,
  );
  const [volume, setVolume] = createSignal(
    store.activeRule?.actions.sound?.volume || 100,
  );
  const [path, setPath] = createSignal<Sound | null>(
    findSound(store.activeRule?.actions.sound?.path) || null,
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
          path: string;
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

  createEffect(
    on(active, () => {
      if (store.filter && store.activeRule) {
        setSoundEnabled(store.filter, store.activeRule, active());
      }
    }),
  );
  createEffect(
    on(path, () => {
      if (store.filter && store.activeRule && path()?.path && path()?.type) {
        setSoundPath(store.filter, store.activeRule, {
          value: path()?.id,
          path: path()?.path,
          type: path()?.type,
        });
        setSoundRef();
      }
    }),
  );
  createEffect(
    on(volume, () => {
      if (store.filter && store.activeRule) {
        setSoundVolume(store.filter, store.activeRule, volume());
      }
    }),
  );
  createEffect(() => {
    if (store.activeRule) {
      const path = findSound(store.activeRule.actions?.sound?.path);
      if (path) {
        setPath(path);
      } else {
        setPath(null);
      }
      setActive(store.activeRule.actions.sound?.enabled || false);
      setVolume(store.activeRule.actions.sound?.volume || 100);
      setSoundRef();
    }
  });

  onMount(async () => {
    if (chromatic.runtime === "desktop") {
      refreshSounds();
    }

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
          {active() ? (
            <>
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
            </>
          ) : (
            <></>
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
