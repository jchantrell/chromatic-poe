import { createEffect, createSignal } from "solid-js";
import { store } from "@app/store";
import {
  Color,
  IconSize,
  setBeamEnabled,
  setMapIconEnabled,
  Shape,
} from "@app/lib/filter";
import MapIconPicker from "@app/pages/editor/map-icon-picker";
import ColorPicker from "@app/pages/editor/color-picker";
import { Checkbox } from "@pkgs/ui/checkbox";
import { Label } from "@pkgs/ui/label";
import BeamPicker from "@app/pages/editor/beam-picker";
import ConditionManager from "./condition-builder";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@pkgs/ui/slider";
import Tooltip from "@app/components/tooltip";

export default function RuleEditor() {
  if (!store.activeRule) return <></>;

  return (
    <div class='size-full p-10 overflow-y-auto flex flex-col items-center'>
      <div class='flex h-10'>
        <div class='flex gap-1 w-full items-center justify-center'>
          <div
            class='flex w-full text-nowrap items-center justify-center border-[1.5px] min-w-fit max-h-fit px-2 mb-2'
            style={{
              color: `rgba(${store.activeRule.actions.text?.r ?? 0}, ${store.activeRule.actions.text?.g ?? 0}, ${store.activeRule.actions.text?.b ?? 0}, ${(store.activeRule.actions.text?.a ?? 255) / 255})`,
              "border-color": `rgba(${store.activeRule.actions.border?.r ?? 0}, ${store.activeRule.actions.border?.g ?? 0}, ${store.activeRule.actions.border?.b ?? 0}, ${(store.activeRule.actions.border?.a ?? 255) / 255})`,
              "background-color": `rgba(${store.activeRule.actions.background?.r ?? 0}, ${store.activeRule.actions.background?.g ?? 0}, ${store.activeRule.actions.background?.b ?? 0}, ${(store.activeRule.actions.background?.a ?? 255) / 255})`,
              "max-width": `${(store.activeRule.actions.fontSize || 32) * 6}px`,
              "font-size": `${(store.activeRule.actions.fontSize || 32) / 1.5}px`,
            }}
          >
            {store.activeRule.bases.length
              ? store.activeRule.bases
                  .filter((base) => base.enabled)
                  .reduce(
                    (a, b) => {
                      return a.name.length <= b.name.length ? a : b;
                    },
                    store.activeRule.bases.find((base) => base.enabled) ||
                      store.activeRule.bases[0],
                  ).name
              : "Item"}
          </div>
        </div>
      </div>
      <div class='w-full flex-col flex gap-4 justify-center items-center my-2'>
        <div class='gap-1 flex flex-col'>
          <div class='flex flex-col gap-2'>
            <ColorPicker label='Text' key='text' />
            <ColorPicker label='Border' key='border' />
            <ColorPicker label='Background' key='background' />
            <LabelSize />
            <SoundPicker />
            <ToggleMapIcon />
            <ToggleBeam />
          </div>
        </div>
      </div>
      <ConditionManager />
    </div>
  );
}

function LabelSize() {
  const [size, setSize] = createSignal(32);

  function handleChange(value: number) {
    if (store.filter && store.activeRule?.actions) {
      store.activeRule.actions.fontSize = value;
    }
  }

  createEffect(() => {
    setSize(store.activeRule?.actions.fontSize || 32);
  });

  return (
    <div class='flex items-center gap-1.5'>
      <Label class='w-[87px]'>Size</Label>
      {size()}
      <Slider
        class='w-[80px] ml-2'
        minValue={1}
        maxValue={45}
        step={1}
        value={[size()]}
        onChange={(v) => handleChange(v[0])}
      >
        <SliderTrack class='bg-accent'>
          <SliderFill class='bg-neutral-400' />
          <SliderThumb class='size-4' />
        </SliderTrack>
      </Slider>
    </div>
  );
}

function ToggleMapIcon() {
  const [mapIconActive, setMapIconActive] = createSignal(false);

  function handleMapIcon(enabled: boolean) {
    if (store.filter && store.activeRule?.actions.icon) {
      setMapIconEnabled(store.filter, store.activeRule, enabled);
    }
    if (store.activeRule && !store.activeRule?.actions.icon && enabled) {
      store.activeRule.actions.icon = {
        color: Color.Red,
        shape: Shape.Circle,
        size: IconSize.Small,
        enabled: true,
      };
    }
  }
  createEffect(() => {
    setMapIconActive(store.activeRule?.actions.icon?.enabled || false);
  });

  return (
    <div class='flex text-nowrap items-center h-8'>
      <Label class='w-[94px]' for='icon'>
        Map Icon
      </Label>
      <Checkbox
        id='icon'
        class='mr-2'
        onChange={handleMapIcon}
        checked={mapIconActive()}
      />
      <div class='flex'>
        {store.activeRule?.actions.icon?.enabled ? (
          <Tooltip text='Edit Map Icon'>
            <MapIconPicker />
          </Tooltip>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

function ToggleBeam() {
  const [beamActive, setBeamActive] = createSignal(false);

  function handleBeam(enabled: boolean) {
    if (store.filter && store.activeRule?.actions.beam) {
      setBeamEnabled(store.filter, store.activeRule, enabled);
    }
    if (store.activeRule && !store.activeRule?.actions.beam && enabled) {
      store.activeRule.actions.beam = {
        temp: false,
        color: Color.Red,
        enabled: true,
      };
    }
  }

  createEffect(() => {
    setBeamActive(store.activeRule?.actions.beam?.enabled || false);
  });

  return (
    <div class='flex text-nowrap items-center h-2'>
      <Label class='w-[94px]' for='beam'>
        Beam
      </Label>
      <Checkbox id='beam' onChange={handleBeam} checked={beamActive()} />
      <div class='flex grow-0'>
        {store.activeRule?.actions.beam?.enabled ? (
          <Tooltip text='Edit beam color and duration'>
            <BeamPicker />
          </Tooltip>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

function SoundPicker() {
  return <div>SoundPicker</div>;
}
