import { createEffect, For } from "solid-js";
import {
  Slider,
  SliderFill,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from "@pkgs/ui/slider";
import { createStore } from "solid-js/store";
import { ToggleGroup, ToggleGroupItem } from "@pkgs/ui/toggle-group";
import { Switch, SwitchControl, SwitchThumb } from "@pkgs/ui/switch";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pkgs/ui/select";
import { type Conditions, Operator } from "@app/lib/filter";
import { store } from "@app/store";
import { Label } from "@pkgs/ui/label";

const operators = [
  Operator.gte,
  Operator.lte,
  Operator.eq,
  Operator.gt,
  Operator.lt,
];

const conditionTypes: Record<
  keyof Conditions,
  {
    label: string;
    type: string;
    operators: boolean;
    defaultValue: Conditions[keyof Conditions]["value"];
    min?: number;
    max?: number;
    options?: string[];
  }
> = {
  height: {
    label: "Height",
    type: "slider",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 4,
  },
  rarity: {
    label: "Rarity",
    type: "toggle",
    operators: false,
    defaultValue: [],
    options: ["Normal", "Magic", "Rare"],
  },
  corrupted: {
    label: "Corrupted",
    type: "checkbox",
    defaultValue: false,
    operators: false,
  },
};

function SliderInput(props: {
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
        return `${params.values[0]}`;
      }}
      onChange={(v) => props.onChange(v[0])}
      class='space-y-1 w-[150px]'
    >
      <SliderValueLabel />
      <div class='flex w-full'>
        <SliderTrack>
          <SliderThumb class='border border-neutral-400' />
        </SliderTrack>
      </div>
    </Slider>
  );
}

function RangeInput(props: {
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
      <SliderValueLabel />
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

function SelectInput(props: {
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

function ToggleInput(props: {
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
      >
        <For each={conditionTypes[props.key].options}>
          {(option) => {
            return (
              <ToggleGroupItem
                class='data-[pressed]:bg-muted border border-primary'
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

function CheckboxInput(props: {
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

export default function ConditionManager() {
  function addCondition<T extends keyof Conditions>(condition: T) {
    if (store.activeRule) {
      const newCondition: Conditions[T] = {
        value: conditionTypes[condition as T].defaultValue,
      };
      if (conditionTypes[condition].operators) {
        newCondition.operator = Operator.eq;
      }
      store.activeRule.conditions[condition] = newCondition as Conditions[T];
    }
  }

  function updateCondition<T extends keyof Conditions>(
    condition: T,
    key: keyof Conditions[T],
    value: Conditions[keyof Conditions],
  ) {
    if (store.activeRule) {
      store.activeRule.conditions[condition] = {
        ...store.activeRule.conditions[condition],
        [key]: value,
      };
    }
  }

  function removeCondition(condition: keyof Conditions) {
    if (store.activeRule) {
      delete store.activeRule.conditions[condition];
    }
  }

  return (
    <div class='mx-auto p-4'>
      <div class='space-y-4'>
        <div class='flex justify-between items-center'>
          <div class='flex items-center gap-1'>
            <Label class='text-lg font-semibold'>Show</Label>
            <Switch
              checked={store.activeRule?.show}
              onChange={(checked) => {
                // FIXME
                store.activeRule.show = checked;
              }}
              class='flex items-center space-x-2'
            >
              <SwitchControl class='bg-accent'>
                <SwitchThumb class='border border-neutral-400 data-checked:border-neutral-500' />
              </SwitchControl>
            </Switch>
          </div>
          <button
            onClick={() => addCondition("rarity")}
            type='button'
            class='flex items-center gap-2 px-3 py-2 bg-neutral-700 text-white rounded hover:bg-primary-muted transition-colors'
          >
            Edit Conditions
          </button>
        </div>

        {Object.keys(store.activeRule?.conditions || {}).length === 0 ? (
          <div class='text-center py-8 text-muted-foreground'>
            No conditions. Click "Edit Conditions" to start.
          </div>
        ) : (
          <div class='space-y-4 flex flex-col items-start'>
            <For each={Object.entries(store.activeRule?.conditions || {})}>
              {([key, value]) => {
                const condition =
                  conditionTypes[key as keyof typeof conditionTypes];
                return (
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <div class='flex gap-4 items-center justify-between p-4 bg-neutral-500/50 rounded-lg'>
                        <Label class='text-md'>{condition.label}</Label>

                        {condition.operators && (
                          <div class='w-full'>
                            <select
                              value={value.operator}
                              onChange={(value) => {
                                updateCondition(key, "operator", value);
                              }}
                              class='w-full px-3 py-2 bg-muted border rounded focus:outline-none focus:ring-2 focus:ring-accent-foreground'
                            >
                              <For each={operators}>
                                {(op) => <option value={op}>{op}</option>}
                              </For>
                            </select>
                          </div>
                        )}

                        <div class='ml-2'>
                          {condition.type === "slider" && (
                            <SliderInput
                              key={key}
                              value={value.value}
                              onChange={(v) => {
                                updateCondition(key, "value", v);
                              }}
                            />
                          )}
                          {condition.type === "range" && (
                            <RangeInput
                              key={key}
                              value={value.value}
                              onChange={(v) => {
                                updateCondition(key, "value", v);
                              }}
                            />
                          )}
                          {condition.type === "select" && (
                            <SelectInput
                              key={key}
                              value={value.value}
                              onChange={(v) => {
                                updateCondition(key, "value", v);
                              }}
                            />
                          )}
                          {condition.type === "toggle" && (
                            <ToggleInput
                              key={key}
                              value={value.value}
                              onChange={(v) => {
                                updateCondition(key, "value", v);
                              }}
                            />
                          )}
                          {condition.type === "checkbox" && (
                            <CheckboxInput
                              key={key}
                              value={value.value}
                              onChange={(v) => {
                                updateCondition(key, "value", v);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuPortal>
                      <ContextMenuContent class='w-48'>
                        <ContextMenuItem
                          onMouseDown={() => removeCondition(key)}
                        >
                          <span>Delete</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenuPortal>
                  </ContextMenu>
                );
              }}
            </For>
          </div>
        )}
      </div>
    </div>
  );
}
