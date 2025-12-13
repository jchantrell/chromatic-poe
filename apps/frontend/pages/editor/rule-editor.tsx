import Tooltip from "@app/components/tooltip";
import { CloseIcon } from "@app/icons";
import {
    Color,
    IconSize,
    setBeamEnabled,
    setDropSoundEnabled,
    setDropSoundToggle,
    setMapIconEnabled,
    Shape,
} from "@app/lib/filter";
import BeamPicker from "@app/pages/editor/beam-picker";
import ColorPicker from "@app/pages/editor/color-picker";
import MapIconPicker from "@app/pages/editor/map-icon-picker";
import { store } from "@app/store";
import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@app/ui/slider";
import { Switch, SwitchControl, SwitchThumb } from "@app/ui/switch";
import { createEffect, createSignal } from "solid-js";
import ConditionManager from "./condition-builder";
import SoundPicker from "./sound-picker";

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
    <div class='flex items-center gap-1.5 h-6'>
      <Label class='w-[87px]'>Size</Label>
      <div class='w-5'>{size()}</div>
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
    <div class='flex text-nowrap items-center h-6'>
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
    <div class='flex text-nowrap items-center h-6'>
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

function ToggleDropSound() {
  const [dropSoundActive, setDropSoundActive] = createSignal(false);

  function handleActive(enabled: boolean) {
    if (store.filter && store.activeRule?.actions.dropSound) {
      setDropSoundEnabled(store.filter, store.activeRule, enabled);
    }
    if (store.activeRule && !store.activeRule?.actions.dropSound && enabled) {
      store.activeRule.actions.dropSound = { enabled: true, toggle: true };
    }
  }

  function handleDropSound(enabled: boolean) {
    if (store.filter && store.activeRule?.actions.dropSound) {
      setDropSoundToggle(store.filter, store.activeRule, enabled);
    }
  }

  createEffect(() => {
    setDropSoundActive(store.activeRule?.actions.dropSound?.enabled || false);
  });

  return (
    <div class='flex text-nowrap items-center h-6'>
      <Label class='w-[94px]' for='dropSound'>
        Drop Sound
      </Label>
      <Tooltip text='Enable/Disable Native Drop Sound'>
        <Checkbox
          id='dropSound'
          onChange={handleActive}
          checked={dropSoundActive()}
        />
      </Tooltip>
      <div class='flex grow-0'>
        {store.activeRule?.actions.dropSound?.enabled ? (
          <div class='flex items-center gap-1'>
            <Switch
              checked={store.activeRule?.actions.dropSound?.toggle}
              onChange={(checked) => {
                handleDropSound(checked);
              }}
              class='flex items-center space-x-2'
            >
              <SwitchControl class='bg-accent'>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default function RuleEditor() {
  if (!store.activeRule) return <></>;

  return (
    <div class='size-full p-10 overflow-y-auto overflow-x-hidden flex flex-col items-center'>
      <div class='rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[expanded]:bg-accent data-[expanded]:text-muted-foreground'>
        <button
          type='button'
          class='absolute top-1 left-1 p-1 flex items-center justify-center w-6 h-6 bg-muted rounded-full text-center'
          onMouseDown={() => {
            store.activeRule = null;
          }}
        >
          <CloseIcon />
        </button>
      </div>
      <div class='flex h-24 items-center justify-center'>
        <div
          class='flex w-full text-nowrap items-center justify-center border-[1.5px] min-w-fit max-h-fit px-3 mb-2'
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
      <div class='flex gap-4 min-w-[400px]'>
        <div class='flex-col flex gap-4 justify-center items-center'>
          <div class='gap-2 flex flex-col'>
            <ColorPicker label='Text' key='text' />
            <ColorPicker label='Border' key='border' />
            <ColorPicker label='Background' key='background' />
            <LabelSize />
            <ToggleMapIcon />
            <ToggleBeam />
            <ToggleDropSound />
            <SoundPicker />
          </div>
        </div>
        <div class='border border-muted p-1 text-sm text-wrap whitespace-pre bg-muted/70 overflow-x-none overflow-y-auto max-h-[250px] max-w-[250px]'>
          {store.filter?.convertToText(store.activeRule)}
        </div>
      </div>
      <ConditionManager rule={store.activeRule} />
    </div>
  );
}
