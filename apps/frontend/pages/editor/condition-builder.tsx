import { For } from "solid-js";
import {
  Slider,
  SliderFill,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from "@pkgs/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@pkgs/ui/toggle-group";
import { Switch, SwitchControl, SwitchThumb } from "@pkgs/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pkgs/ui/select";
import { type Conditions, Operator, Rarity } from "@app/lib/filter";
import { store } from "@app/store";
import { Label } from "@pkgs/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@pkgs/ui/dialog";
import { Button } from "@pkgs/ui/button";
import { Separator } from "@pkgs/ui/separator";
import { excuteCmd } from "@app/lib/filter/commands";
import { ItemPicker } from "./item-picker";

const operators = [
  Operator.gte,
  Operator.lte,
  Operator.eq,
  Operator.gt,
  Operator.lt,
];

const conditionTypes: Partial<
  Record<
    keyof Conditions,
    {
      label: string;
      type: string;
      group: string;
      operators: boolean;
      defaultValue: Conditions[keyof Conditions]["value"];
      min?: number;
      max?: number;
      options?: string[];
    }
  >
> = {
  // Basic properties
  height: {
    label: "Height",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 4,
  },
  width: {
    label: "Width",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 4,
  },

  // Level and quality related
  areaLevel: {
    label: "Area Level",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  dropLevel: {
    label: "Drop Level",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  itemLevel: {
    label: "Item Level",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 100,
  },
  quality: {
    label: "Quality",
    type: "slider",
    group: "General",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 30,
  },

  // Stack properties
  stackSize: {
    label: "Stack Size",
    type: "slider",
    group: "Currency",
    operators: true,
    defaultValue: 1,
    min: 1,
  },

  // Gem specific
  gemLevel: {
    label: "Gem Level",
    type: "slider",
    group: "Gems",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 21,
  },
  // transfiguredGem: {
  //   label: "Transfigured Gem",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },

  // Map specific
  mapTier: {
    label: "Map Tier",
    type: "slider",
    group: "Maps",
    operators: true,
    defaultValue: 1,
    min: 1,
    max: 16,
  },
  // elderMap: {
  //   label: "Elder Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // shapedMap: {
  //   label: "Shaped Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // blightedMap: {
  //   label: "Blighted Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // uberBlightedMap: {
  //   label: "Uber Blighted Map",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },

  // Item state
  hasImplicitMod: {
    label: "Has Implicit Mod",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  rarity: {
    label: "Rarity",
    type: "toggle",
    group: "General",
    operators: false,
    defaultValue: [],
    options: Object.values(Rarity).filter((r) => r !== Rarity.unique),
  },
  identified: {
    label: "Identified",
    type: "checkbox",
    group: "General",
    operators: false,
    defaultValue: false,
  },
  // scourged: {
  //   label: "Scourged",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // fractured: {
  //   label: "Fractured",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  mirrored: {
    label: "Mirrored",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  corrupted: {
    label: "Corrupted",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  enchanted: {
    label: "Enchanted",
    type: "checkbox",
    group: "Gear",
    operators: false,
    defaultValue: false,
  },
  // synthesised: {
  //   label: "Synthesised",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // replica: {
  //   label: "Replica",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },
  // crucibleTree: {
  //   label: "Has Crucible Tree",
  //   type: "checkbox",
  //   operators: false,
  //   defaultValue: false,
  // },

  // Mods and enchantments
  // corruptedMods: {
  //   label: "Corrupted Mods",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  // },
  // hasExplicitMod: {
  //   label: "Explicit Mods",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },
  // hasEnchantment: {
  //   label: "Enchantments",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },
  // archnemesisMod: {
  //   label: "Archnemesis Mods",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },

  // // Cluster jewel specific
  // enchantmentPassiveNode: {
  //   label: "Passive Node",
  //   type: "text-list",
  //   operators: false,
  //   defaultValue: [],
  // },
  // enchantmentPassiveNum: {
  //   label: "slider of Passives",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 1,
  //   min: 1,
  // },

  // Influence
  // hasSearingExarchImplicit: {
  //   label: "Searing Exarch Implicit",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  // },
  // hasEaterOfWorldsImplicit: {
  //   label: "Eater of Worlds Implicit",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  // },
  // hasInfluence: {
  //   label: "Influence",
  //   type: "toggle",
  //   operators: false,
  //   defaultValue: [],
  //   options: Object.values(Influence),
  // },

  // Sockets
  // linkedSockets: {
  //   label: "Linked Sockets",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  //   max: 6,
  // },
  sockets: {
    label: "Sockets",
    type: "slider",
    group: "Gear",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 3,
  },
  // socketGroup: {
  //   label: "Socket Group",
  //   type: "text",
  //   operators: true,
  //   defaultValue: "",
  // },

  // Defense stats
  // defencePercentile: {
  //   label: "Defence Percentile",
  //   type: "slider",
  //   operators: true,
  //   defaultValue: 0,
  //   min: 0,
  //   max: 100,
  // },
  armour: {
    label: "Armour",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  evasion: {
    label: "Evasion",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    max: 5000,
    min: 0,
  },
  energyShield: {
    label: "Energy Shield",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
  ward: {
    label: "Ward",
    type: "slider",
    group: "Armour",
    operators: true,
    defaultValue: 0,
    min: 0,
    max: 5000,
  },
};

function SliderInput(props: {
  key: string;
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
      class='space-y-1 w-[150px]'
    >
      <SliderValueLabel />
      <div class='flex w-[150px]'>
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

function ConditionToggle(props: {
  label: string;
  key: keyof Conditions;
  onChange: (...rest: unknown[]) => void;
}) {
  return (
    <div class='flex items-center gap-2 h-5'>
      <input
        type='checkbox'
        id='icon'
        class='size-5'
        checked={store.activeRule?.conditions[props.key]}
        onInput={(v) => props.onChange(props.key, v.target.checked)}
      />
      <Label>{props.label}</Label>
    </div>
  );
}

function ConditionToggleGroup(props: {
  key: string;
  onChange: (...rest: unknown[]) => void;
}) {
  let conditions = Object.entries(conditionTypes).filter(
    ([_, value]) => value.group === props.key,
  );
  if (store.activeRule?.bases.some((e) => e.category === "Uniques")) {
    conditions = conditions.filter(([key]) => key !== "rarity");
  }
  return (
    <div class='flex flex-col gap-3 py-2'>
      <Label class='text-lg h-5 mb-1'>{props.key}</Label>
      <Separator />
      <For each={conditions}>
        {([key, value]) => (
          <ConditionToggle
            label={value.label}
            key={key}
            onChange={(key, checked) => {
              props.onChange(key, checked);
            }}
          />
        )}
      </For>
    </div>
  );
}

export default function ConditionManager() {
  function addCondition<T extends keyof Conditions>(condition: T) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        const newCondition: Conditions[T] = {
          value: conditionTypes[condition as T].defaultValue,
        };
        if (conditionTypes[condition].operators) {
          newCondition.operator = Operator.eq;
        }
        store.activeRule.conditions[condition] = newCondition as Conditions[T];
      });
    }
  }

  function updateCondition<T extends keyof Conditions>(
    condition: T,
    key: keyof Conditions[T],
    value: Conditions[keyof Conditions],
  ) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        store.activeRule.conditions[condition][key] = value;
      });
    }
  }

  function removeCondition(condition: keyof Conditions) {
    if (store.filter && condition in store.activeRule.conditions) {
      excuteCmd(store.filter, () => {
        delete store.activeRule.conditions[condition];
      });
    }
  }

  function toggleCondition(key: keyof Conditions, checked: boolean) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        if (checked) {
          addCondition(key as keyof Conditions);
        }
        if (!checked) {
          removeCondition(key as keyof Conditions);
        }
      });
    }
  }

  function toggleRule(checked: boolean) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        store.activeRule.show = checked;
      });
    }
  }

  return (
    <div class='mx-auto p-4 '>
      <div class='space-y-4 flex flex-col justify-center w-[400px]'>
        <div class='flex gap-5 items-center'>
          <Dialog>
            <DialogTrigger class='text-md font-semibold' as={Button<"button">}>
              Edit Items
            </DialogTrigger>
            <DialogContent class='sm:max-w-[600px]'>
              <ItemPicker rule={store.activeRule} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger class='text-md font-semibold' as={Button<"button">}>
              Edit Conditions
            </DialogTrigger>
            <DialogContent class='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>
                  Edit {store.activeRule?.name} Conditions
                </DialogTitle>
              </DialogHeader>
              <div class='grid grid-cols-2 gap-3 py-2'>
                <ConditionToggleGroup
                  key='General'
                  onChange={(key, checked) => {
                    toggleCondition(key, checked);
                  }}
                />
                <ConditionToggleGroup
                  key='Gear'
                  onChange={(key, checked) => {
                    toggleCondition(key, checked);
                  }}
                />
                <ConditionToggleGroup
                  key='Armour'
                  onChange={(key, checked) => {
                    toggleCondition(key, checked);
                  }}
                />
                <ConditionToggleGroup
                  key='Currency'
                  onChange={(key, checked) => {
                    toggleCondition(key, checked);
                  }}
                />
                <ConditionToggleGroup
                  key='Gems'
                  onChange={(key, checked) => {
                    toggleCondition(key, checked);
                  }}
                />
                <ConditionToggleGroup
                  key='Maps'
                  onChange={(key, checked) => {
                    toggleCondition(key, checked);
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
          <div class='flex items-center gap-1'>
            <Label class='text-md font-semibold'>Show</Label>
            <Switch
              checked={store.activeRule?.show}
              onChange={(checked) => {
                toggleRule(checked);
              }}
              class='flex items-center space-x-2'
            >
              <SwitchControl class='bg-accent'>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
          </div>
        </div>

        {Object.keys(store.activeRule?.conditions).length === 0 ? (
          <div class='text-center py-8 text-muted-foreground'>
            No conditions. Click "Edit Conditions" to start.
          </div>
        ) : (
          <div class='space-y-4 flex flex-col items-start'>
            <For each={Object.entries(store.activeRule?.conditions)}>
              {([key, value]) => {
                const condition =
                  conditionTypes[key as keyof typeof conditionTypes];
                const EXCLUDED_OPERATORS = [Operator.gte, Operator.lte];
                const filteredOperators = operators.filter((op) => {
                  if (key === "sockets" && EXCLUDED_OPERATORS.includes(op)) {
                    return false;
                  }
                  return true;
                });
                return (
                  <div class='flex gap-4 items-center justify-between p-4 bg-neutral-500/50 rounded-lg'>
                    <Label class='text-md text-nowrap'>{condition.label}</Label>

                    {condition.operators && (
                      <div class='w-full'>
                        <Select
                          value={value.operator}
                          onChange={(value) => {
                            updateCondition(key, "operator", value);
                          }}
                          options={filteredOperators}
                          itemComponent={(props) => (
                            <SelectItem item={props.item}>
                              {props.item.rawValue}
                            </SelectItem>
                          )}
                        >
                          <SelectTrigger class='w-[70px] bg-muted'>
                            <SelectValue<string>>
                              {(state) => state.selectedOption()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent />
                        </Select>
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
                );
              }}
            </For>
          </div>
        )}
      </div>
    </div>
  );
}
