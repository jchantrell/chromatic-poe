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

export default function RuleEditor() {
  if (!store.activeRule) return <></>;
  const [mapIconActive, setMapIconActive] = createSignal(false);
  const [beamActive, setBeamActive] = createSignal(false);

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
    setMapIconActive(store.activeRule?.actions.icon?.enabled || false);
  });

  createEffect(() => {
    setBeamActive(store.activeRule?.actions.beam?.enabled || false);
  });

  createEffect(() => {
    const opts = { corruptable: false, stackable: false, mirrorable: false };
    if (store.activeRule) {
      for (const base of store.activeRule.bases) {
        if (base.corruptable) {
          opts.corruptable = true;
        }
        if (base.stackable) {
          opts.stackable = true;
        }
        if (base.mirrorable) {
          opts.mirrorable = true;
        }
        if (base.category === "Gems") {
          // add gem conditions
        }
      }
    }
  });

  return (
    <div class='size-full p-10 overflow-y-auto flex flex-col items-center'>
      <div
        class='flex max-w-[300px] w-full items-center justify-between text-lg border-[1.5px]'
        style={{
          color: `rgba(${store.activeRule.actions.text?.r ?? 0}, ${store.activeRule.actions.text?.g ?? 0}, ${store.activeRule.actions.text?.b ?? 0}, ${(store.activeRule.actions.text?.a ?? 255) / 255})`,
          "border-color": `rgba(${store.activeRule.actions.border?.r ?? 0}, ${store.activeRule.actions.border?.g ?? 0}, ${store.activeRule.actions.border?.b ?? 0}, ${(store.activeRule.actions.border?.a ?? 255) / 255})`,
          "background-color": `rgba(${store.activeRule.actions.background?.r ?? 0}, ${store.activeRule.actions.background?.g ?? 0}, ${store.activeRule.actions.background?.b ?? 0}, ${(store.activeRule.actions.background?.a ?? 255) / 255})`,
        }}
      >
        <MapIconPicker />
        <div class='text-center'>{store.activeRule.name}</div>
        <BeamPicker />
      </div>
      <div class='w-full flex-col flex gap-1.5 justify-center items-center mt-2'>
        <div class='flex gap-1.5'>
          <ColorPicker label='Text' key='text' />
          <ColorPicker label='Border' key='border' />
          <ColorPicker label='Background' key='background' />
        </div>
        <div class='flex gap-1.5'>
          <div class='flex text-nowrap'>
            <Checkbox
              id='icon'
              onChange={handleMapIcon}
              checked={mapIconActive()}
            />
            <Label class='ml-1' for='icon'>
              Map Icon
            </Label>
          </div>
          <div class='flex text-nowrap'>
            <Checkbox id='beam' onChange={handleBeam} checked={beamActive()} />
            <Label class='ml-1' for='beam'>
              Beam
            </Label>
          </div>
        </div>
      </div>
      <ConditionManager />
    </div>
  );
}
