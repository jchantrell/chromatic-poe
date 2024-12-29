import {
  Slider,
  SliderFill,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from "@pkgs/ui/slider";
import { type Accessor, createSignal, type Setter } from "solid-js";

export function Condition(props: {
  name: string;
}) {
  switch (props.name) {
    case "Height":
      return <Height />;
    case "Width":
      return <Width />;
  }
}

export function SliderGeneric(props: {
  name: string;
  value: Accessor<number[]>;
  setValue: Setter<number[]>;
}) {
  return (
    <div class='flex gap-2 p-2 bg-neutral-500/75 rounded'>
      <div class='flex justify-end items-center'>{props.name}</div>
      <div>
        <Slider
          minValue={1}
          maxValue={4}
          getValueLabel={(params) => {
            if (params.values[0] === params.values[1]) {
              return `${params.values[0]}`;
            }
            return `${params.values[0]} - ${params.values[1]}`;
          }}
          value={props.value()}
          onChange={props.setValue}
          class='w-[300px] space-y-1'
        >
          <SliderValueLabel />
          <div class='flex w-full justify-end'>
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
              <SliderThumb />
            </SliderTrack>
          </div>
        </Slider>
      </div>
    </div>
  );
}

// slider
export function Height() {
  const [height, setHeight] = createSignal([2, 3]);
  return <SliderGeneric value={height} setValue={setHeight} name='Height' />;
}
export function Width() {
  const [height, setHeight] = createSignal([2, 3]);
  return <SliderGeneric value={height} setValue={setHeight} name='Width' />;
}
export function AreaLevel() {
  const [areaLevel, setAreaLevel] = createSignal([65, 65]);
  return (
    <SliderGeneric value={areaLevel} setValue={setAreaLevel} name='Width' />
  );
}
export function DropLevel() {
  const [dropLevel, setDropLevel] = createSignal([0, 100]);
  return (
    <SliderGeneric value={dropLevel} setValue={setDropLevel} name='Width' />
  );
}
export function StackSize() {
  const [stackSize, setStackSize] = createSignal([0, 50000]);
  return (
    <SliderGeneric value={stackSize} setValue={setStackSize} name='Width' />
  );
}
export function Quality() {
  return <div>{}</div>;
}
export function GemLevel() {
  return <div>{}</div>;
}
export function MapTier() {
  return <div>{}</div>;
}
export function ItemLevel() {
  return <div>{}</div>;
}
export function LinkedSockets() {
  return <div>{}</div>;
}
export function EnchantmentPassives() {
  return <div>{}</div>;
}
export function DefencePercentile() {}
export function Armour() {}
export function Evasion() {}
export function EnergyShield() {}
export function Ward() {}
export function SearingExarchImplicit() {}
export function EaterOfWorldsImplicit() {}

// bool checkbox
export function TransfiguredGem() {
  return <div>{}</div>;
}
export function ElderMap() {
  return <div>{}</div>;
}
export function ShapedMap() {
  return <div>{}</div>;
}
export function BlightedMap() {
  return <div>{}</div>;
}
export function UberBlightedMap() {
  return <div>{}</div>;
}
export function Identified() {
  return <div>{}</div>;
}
export function HasImplicitMod() {
  return <div>{}</div>;
}
export function Scourged() {
  return <div>{}</div>;
}
export function Fractured() {
  return <div>{}</div>;
}
export function Corrupted() {
  return <div>{}</div>;
}
export function Mirrored() {
  return <div>{}</div>;
}
export function Enchanted() {
  return <div>{}</div>;
}
export function Synthesised() {
  return <div>{}</div>;
}
export function CruciblePassiveTree() {
  return <div>{}</div>;
}
export function Replica() {
  return <div>{}</div>;
}

// multi checkbox
export function Rarity() {
  return <div>{}</div>;
}

// list picker
export function CorruptedMods() {
  return <div>{}</div>;
}
export function HasExplicitMod() {
  return <div>{}</div>;
}
export function HasEnchantment() {
  return <div>{}</div>;
}
export function HasInfluence() {}

// no idea
export function SocketGroup() {}
export function Sockets() {}
export function EnchantmentPassiveNode() {}
