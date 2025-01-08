import { For } from "solid-js";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@pkgs/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@pkgs/ui/toggle-group";
import { Switch, SwitchControl, SwitchThumb } from "@pkgs/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pkgs/ui/select";
import { type Conditions, conditionTypes } from "@app/lib/filter";
import { store } from "@app/store";
import { Label } from "@pkgs/ui/label";
import { Separator } from "@pkgs/ui/separator";
import { TextField, TextFieldInput } from "@pkgs/ui/text-field";

export function SliderInput(props: {
  key: (typeof conditionTypes)[keyof typeof conditionTypes];
  value: number;
  onChange: (...rest: unknown[]) => void;
}) {
  return (
    <Slider
      value={[props.value]}
      minValue={conditionTypes[props.key].min}
      maxValue={conditionTypes[props.key].max}
      onChange={(v) => props.onChange(v[0])}
      getValueLabel={(params) => {
        return `${params.values[0]}`;
      }}
      class='space-y-3 w-[150px]'
    >
      <TextField>
        <TextFieldInput
          type='number'
          class='text-center'
          value={props.value}
          onInput={(v) => props.onChange(v.target.value)}
        />
      </TextField>
      <div class='flex w-[150px]'>
        <SliderTrack>
          <SliderThumb class='border border-2 border-primary bg-secondary' />
        </SliderTrack>
      </div>
    </Slider>
  );
}

export function RangeInput(props: {
  value: number;
  key: (typeof conditionTypes)[keyof typeof conditionTypes];
  onChange: (...rest: unknown[]) => void;
}) {
  return (
    <Slider
      value={[props.value]}
      minValue={conditionTypes[props.key].min}
      maxValue={conditionTypes[props.key].max}
      getValueLabel={(params) => {
        if (params.values[0] === params.values[1]) {
          return `${params.values[0]}`;
        }
        return `${params.values[0]} - ${params.values[1]}`;
      }}
      onChange={(v) => props.onChange(v)}
      class='space-y-1 w-[150px]'
    >
      <TextField>
        <TextFieldInput
          type='number'
          class='text-center'
          value={props.value}
          onInput={(v) => props.onChange(v.target.value)}
        />
      </TextField>
      <div class='flex w-full'>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
          <SliderThumb />
        </SliderTrack>
      </div>
    </Slider>
  );
}

export function SelectInput(props: {
  value: number;
  key: (typeof conditionTypes)[keyof typeof conditionTypes];
  onChange: (...rest: unknown[]) => void;
}) {
  return (
    <Select
      value={conditionTypes[props.key].defaultValue}
      onChange={(val) => props.onChange(val)}
      options={conditionTypes[props.key].options || []}
      itemComponent={(props) => (
        <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
      )}
    >
      <SelectTrigger aria-label={props.key.label} class='w-[180px]'>
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}

export function ToggleInput(props: {
  value: number;
  key: (typeof conditionTypes)[keyof typeof conditionTypes];
  onChange: (...rest: unknown[]) => void;
}) {
  return (
    <div class='space-y-2'>
      <ToggleGroup
        multiple
        onChange={(v) => props.onChange(v)}
        value={props.value}
        class='flex flex-wrap'
      >
        <For each={conditionTypes[props.key].options}>
          {(option) => {
            return (
              <ToggleGroupItem
                class='data-[pressed]:bg-neutral-900 bg-neutral-900/25 border border-accent'
                value={option}
              >
                {option}
              </ToggleGroupItem>
            );
          }}
        </For>
      </ToggleGroup>
    </div>
  );
}

export function CheckboxInput(props: {
  value: boolean;
  key: (typeof conditionTypes)[keyof typeof conditionTypes];
  onChange: (...rest: unknown[]) => void;
}) {
  return (
    <Switch
      checked={props.value}
      onChange={(checked) => props.onChange(checked)}
      class='flex items-center space-x-2'
    >
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
    </Switch>
  );
}

function ConditionToggle(props: {
  label: string;
  key: keyof Conditions;
  onChange: (key: keyof Conditions, checked: boolean) => void;
}) {
  return (
    <div class='flex items-center gap-2'>
      <input
        type='checkbox'
        id='icon'
        class='size-5'
        checked={store.activeRule?.conditions[props.key as keyof Conditions]}
        onInput={(v) => props.onChange(props.key, v.target.checked)}
      />
      <Label>{props.label}</Label>
    </div>
  );
}

export function ConditionToggleGroup(props: {
  key: string;
  onChange: (key: keyof Conditions, checked: boolean) => void;
}) {
  const conditions = Object.entries(conditionTypes).filter(
    ([_, value]) => value.group === props.key,
  );
  return (
    <div class='flex flex-col gap-3 py-2'>
      <Label class='text-lg h-5 mb-1'>{props.key}</Label>
      <Separator />
      <For each={conditions}>
        {([key, value]) => (
          <ConditionToggle
            label={value.label}
            key={key as keyof Conditions}
            onChange={(key, checked) => {
              props.onChange(key, checked);
            }}
          />
        )}
      </For>
    </div>
  );
}
