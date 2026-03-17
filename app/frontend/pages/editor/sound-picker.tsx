import SoundPlayer from "@app/components/sound-player";
import Tooltip from "@app/components/tooltip";
import { AlertTriangleIcon } from "@app/icons";
import {
  setSoundEnabled,
  setSoundPath,
  setSoundVolume,
} from "@app/lib/commands";
import type { Filter } from "@app/lib/filter";
import type { Sound } from "@app/lib/sounds";
import { refreshSounds, store } from "@app/store";
import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@app/ui/slider";
import * as ComboboxPrimitive from "@kobalte/core/combobox";
import { createVirtualizer } from "@tanstack/solid-virtual";
import {
  type Accessor,
  For,
  createMemo,
  createSignal,
  on,
  onMount,
} from "solid-js";

const ITEM_HEIGHT = 32;
const MAX_HEIGHT = 256;

export default function SoundPicker() {
  if (!store.activeRule || !store.filter) {
    return "";
  }

  const allSounds = createMemo<Sound[]>(() => [
    ...store.sounds,
    ...store.defaultSounds,
  ]);

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
  const [missingSoundName, setMissingSoundName] = createSignal<string | null>(
    null,
  );

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
    return allSounds().find((o) => {
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
      const p = path();
      const current = store.activeRule?.actions?.sound?.path;
      if (
        store.activeRule?.actions &&
        p?.path &&
        p?.type &&
        p?.id &&
        (current?.value !== p.id ||
          current?.type !== p.type ||
          current?.path !== p.path)
      ) {
        setSoundPath(store.filter as Filter, store.activeRule, {
          value: p.id,
          path: p.path,
          type: p.type as "custom" | "default",
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
      setMissingSoundName(null);
      return;
    }
    if (store.activeRule?.actions.sound.enabled) {
      const soundPath = store.activeRule.actions?.sound?.path;
      const found = findSound(soundPath);
      if (found) {
        setPath(found);
        setMissingSoundName(null);
      } else {
        setPath(null);
        setMissingSoundName(soundPath?.value ?? null);
      }
      setActive(store.activeRule.actions.sound?.enabled || false);
      setVolume(store.activeRule.actions.sound?.volume || 100);
    }
  });

  onMount(() => refreshSounds(store.filter?.poeVersion as 1 | 2));

  return (
    <>
      <div class='flex text-nowrap items-center h-6'>
        <Label class='w-[94px]'>Alert Sound</Label>
        <Checkbox
          id='sound-picker'
          onChange={handleActive}
          checked={active()}
        />
        <div class='flex grow-0'>
          {active() && (
            <Tooltip
              text={
                missingSoundName()
                  ? "Sound file not found on the file system"
                  : "Edit sound file"
              }
            >
              <ComboboxPrimitive.Root<Sound>
                virtualized
                options={allSounds()}
                optionValue='id'
                optionTextValue='displayName'
                optionLabel='displayName'
                placeholder='Select sound…'
                onChange={(value) => {
                  setPath(value);
                  if (value) {
                    setMissingSoundName(null);
                  }
                }}
                value={path()}
                class='overflow-y-auto'
              >
                <ComboboxPrimitive.Control
                  class='flex h-10 items-center rounded-md border px-3'
                  aria-label='Sound'
                >
                  <div class='h-10 w-10 flex items-center justify-center'>
                    {missingSoundName() ? (
                      <AlertTriangleIcon class='size-5 text-warning-foreground' />
                    ) : sound() ? (
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
                  {missingSoundName() ? (
                    <span class='flex-1 truncate text-sm text-warning-foreground'>
                      {missingSoundName()}
                    </span>
                  ) : (
                    <ComboboxPrimitive.Input class='flex size-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50' />
                  )}
                  <ComboboxPrimitive.Trigger class='size-4 opacity-50'>
                    <ComboboxPrimitive.Icon>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        stroke-width='2'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                        class='size-4'
                      >
                        <path d='M8 9l4 -4l4 4' />
                        <path d='M16 15l-4 4l-4 -4' />
                      </svg>
                    </ComboboxPrimitive.Icon>
                  </ComboboxPrimitive.Trigger>
                </ComboboxPrimitive.Control>
                <ComboboxPrimitive.Portal>
                  <ComboboxPrimitive.Content class='relative z-50 min-w-32 rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80'>
                    <VirtualizedSoundListbox />
                  </ComboboxPrimitive.Content>
                </ComboboxPrimitive.Portal>
              </ComboboxPrimitive.Root>
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

function VirtualizedSoundListbox() {
  let listboxRef!: HTMLUListElement;

  // biome-ignore lint/suspicious/noExplicitAny: Kobalte collection types are internal
  const keysRef: { current: () => string[] } = { current: () => [] };
  // biome-ignore lint/suspicious/noExplicitAny: Kobalte virtualizer ref
  const virtualizerRef: { current: any } = { current: null };

  return (
    <ComboboxPrimitive.Listbox<Sound>
      ref={listboxRef}
      scrollToItem={(key) => {
        if (!virtualizerRef.current) return;
        const index = keysRef.current().indexOf(key);
        if (index >= 0) {
          virtualizerRef.current.scrollToIndex(index);
        }
      }}
      class='m-0 p-1'
      style={{ "max-height": `${MAX_HEIGHT}px`, overflow: "auto" }}
    >
      {(
        // biome-ignore lint/suspicious/noExplicitAny: Kobalte Collection type is internal
        items: Accessor<any>,
      ) => {
        const keys = createMemo(() => [...items().getKeys()]);
        keysRef.current = keys;

        const virtualizer = createVirtualizer({
          get count() {
            return keys().length;
          },
          getScrollElement: () => listboxRef,
          getItemKey: (index: number) => keys()[index],
          estimateSize: () => ITEM_HEIGHT,
          overscan: 5,
        });

        virtualizerRef.current = virtualizer;

        return (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            <For each={virtualizer.getVirtualItems()}>
              {(virtualRow) => {
                const item = items().getItem(String(virtualRow.key));
                if (!item) return null;
                return (
                  <ComboboxPrimitive.Item
                    item={item}
                    class='flex cursor-default select-none items-center justify-between rounded-sm px-2 text-sm outline-hidden data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-50 truncate'
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <ComboboxPrimitive.ItemLabel class='truncate'>
                      {item.rawValue.displayName}
                    </ComboboxPrimitive.ItemLabel>
                    <ComboboxPrimitive.ItemIndicator>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        stroke-width='2'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                        class='size-4 shrink-0'
                      >
                        <path d='M5 12l5 5l10 -10' />
                      </svg>
                    </ComboboxPrimitive.ItemIndicator>
                  </ComboboxPrimitive.Item>
                );
              }}
            </For>
          </div>
        );
      }}
    </ComboboxPrimitive.Listbox>
  );
}
