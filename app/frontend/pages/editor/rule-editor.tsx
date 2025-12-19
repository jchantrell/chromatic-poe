import Tooltip from "@app/components/tooltip";
import { CloseIcon } from "@app/icons";
import { Color, IconSize, Shape } from "@app/lib/action";
import {
  setBeamEnabled,
  setDropSoundEnabled,
  setDropSoundToggle,
  setMapIconEnabled,
} from "@app/lib/commands";
import BeamPicker from "@app/pages/editor/beam-picker";
import ColorPicker from "@app/pages/editor/color-picker";
import MapIconPicker from "@app/pages/editor/map-icon-picker";
import { setActiveRule, store } from "@app/store";
import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@app/ui/slider";
import { Switch, SwitchControl, SwitchThumb } from "@app/ui/switch";
import { createEffect, createSignal } from "solid-js";
import ConditionManager from "./condition-builder";
import { DropPreview } from "./drop-preview";
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
      <div class='ml-2 flex grow-0'>
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

function RulePreview() {
  if (!store.activeRule) return null;
  return (
    <textarea
      id='rule-preview'
      spellcheck={false}
      class='border border-accent-foreground/25 text-sm text-wrap py-1 px-2 bg-primary-foreground/80 overflow-x-hidden overflow-y-auto resize-none outline-hidden size-full scrollbar-thumb-neutral-600'
    >
      {store.filter?.convertToText(store.activeRule)}
    </textarea>
  );
}

function RuleActions() {
  return (
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
  );
}

export default function RuleEditor() {
  if (!store.activeRule) return null;

  function handleNameChange(e: Event) {
    if (e.target instanceof HTMLInputElement && store.activeRule) {
      store.activeRule.name = e.target.value;
    }
  }

  function setActiveRuleToNone() {
    setActiveRule(null);
  }

  return (
    <div class='inset-0 size-full flex flex-col items-center bg-muted/80 overflow-hidden flex-1 min-h-0 @container'>
      <div class='w-full p-1 shrink-0 flex'>
        <span class='text-xl w-full justify-center flex'>
          <input
            class={`bg-transparent py-1 px-3  mt-1 ml-2 border-none min-w-0 flex-1`}
            type='text'
            spellcheck={false}
            value={store.activeRule.name}
            onChange={handleNameChange}
          />
        </span>
        <Tooltip text={"Close rule editor"}>
          <button
            type='button'
            class='p-0.5 mr-1 flex items-center border border-muted-foreground/60 justify-center w-6 h-6 bg-secondary text-center cursor-pointer rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-expanded:bg-accent data-expanded:text-muted-foreground'
            onMouseDown={setActiveRuleToNone}
          >
            <CloseIcon />
          </button>
        </Tooltip>
      </div>
      <div class='flex justify-between w-full flex-1 min-h-0 pb-2'>
        <div class='px-5 flex flex-col overflow-hidden gap-1 @xl:max-w-xl w-full flex-1 min-h-0'>
          <div class='flex items-center min-h-[60px] shrink-0 gap-10'>
            <DropPreview rule={store.activeRule} dynamicSize />
          </div>
          <div class='flex gap-5 p-2 flex-1 min-h-0'>
            <div class='flex flex-col gap-2 w-full flex-1 min-h-0'>
              <div class='shrink-0'>
                <RuleActions />
              </div>
              <ConditionManager rule={store.activeRule} />
            </div>
          </div>
        </div>
        <div class='flex-1 min-h-0 hidden @2xl:flex pr-2'>
          <RulePreview />
        </div>
      </div>
    </div>
  );
}
