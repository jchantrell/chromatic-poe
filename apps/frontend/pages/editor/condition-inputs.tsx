import { For } from "solid-js";
import { Slider, SliderThumb, SliderTrack } from "@pkgs/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@pkgs/ui/toggle-group";
import { Switch, SwitchControl, SwitchThumb } from "@pkgs/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pkgs/ui/select";
import { type ConditionKey, conditionTypes } from "@app/lib/filter";
import { TextField, TextFieldInput } from "@pkgs/ui/text-field";

type FilteredConditionKey = Exclude<ConditionKey, ConditionKey.BASE_TYPE>;

export function SliderInput(props: {
  key: FilteredConditionKey;
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
          onInput={(v) => props.onChange(Number(v.target.value))}
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

export function SelectInput(props: {
  value: number;
  key: FilteredConditionKey;
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
      <SelectTrigger
        aria-label={conditionTypes[props.key].label}
        class='w-[180px]'
      >
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}

export function ToggleInput(props: {
  value: string[];
  key: FilteredConditionKey;
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
  key: FilteredConditionKey;
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
