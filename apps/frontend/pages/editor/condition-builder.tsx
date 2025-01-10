import { For } from "solid-js";
import { Switch, SwitchControl, SwitchThumb } from "@pkgs/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pkgs/ui/select";
import {
  type Conditions,
  type FilterRule,
  conditionTypes,
  Operator,
} from "@app/lib/filter";
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
import { excuteCmd } from "@app/lib/filter/commands";
import { ItemPicker } from "./item-picker";
import Tooltip from "@app/components/tooltip";
import {
  CheckboxInput,
  RangeInput,
  SelectInput,
  SliderInput,
  ToggleInput,
  ConditionToggleGroup,
} from "./condition-inputs";

const operators = [
  Operator.GTE,
  Operator.LTE,
  Operator.EXACT,
  Operator.GT,
  Operator.LT,
];

export default function ConditionManager(props: { rule: FilterRule }) {
  function addCondition(condition: keyof Conditions) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        const newCondition: Conditions[keyof Conditions] = {
          value: conditionTypes[condition]?.defaultValue,
        };
        if (conditionTypes[condition]?.operators) {
          newCondition.operator = Operator.EXACT;
        }
        props.rule.conditions[condition] = newCondition;
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
        props.rule.conditions[condition][key] = value;
      });
    }
  }

  function removeCondition(condition: keyof Conditions) {
    if (store.filter && condition in props.rule.conditions) {
      excuteCmd(store.filter, () => {
        delete props.rule.conditions[condition];
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
    if (store.filter && props.rule) {
      excuteCmd(store.filter, () => {
        props.rule.show = checked;
      });
    }
  }

  function toggleContinue(checked: boolean) {
    if (store.filter && props.rule) {
      excuteCmd(store.filter, () => {
        if (props.rule.continue !== checked) {
          props.rule.continue = checked;
        }
      });
    }
  }

  return (
    <div class='mx-auto p-4 h-full'>
      <div class='space-y-4 flex flex-col size-full max-w-[650px]'>
        <div class='flex gap-5 items-center'>
          <Dialog defaultOpen>
            <DialogTrigger class='text-md font-semibold' as={Button<"button">}>
              Edit Items
            </DialogTrigger>
            <DialogContent class='sm:max-w-[600px]'>
              <ItemPicker rule={props.rule} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger class='text-md font-semibold' as={Button<"button">}>
              Edit Conditions
            </DialogTrigger>
            <DialogContent class='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>Edit {props.rule?.name} Conditions</DialogTitle>
              </DialogHeader>
              <div class='grid grid-cols-2 gap-3 py-2'>
                <ConditionToggleGroup
                  key='General'
                  onChange={(key: keyof Conditions, checked: boolean) => {
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
          <div class='grid grid-rows-2 gap-1'>
            <Tooltip text='Show or Hide'>
              <div class='flex items-center gap-1'>
                <Label class='text-md font-semibold mr-5'>Show</Label>
                <Switch
                  checked={props.rule?.show}
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
            </Tooltip>
            <Tooltip text='Continue to the next rule after this one'>
              <div class='flex items-center gap-1'>
                <Label class='text-md font-semibold'>Continue</Label>
                <Switch
                  checked={props.rule?.continue}
                  onChange={(checked) => {
                    toggleContinue(checked);
                  }}
                  class='flex items-center space-x-1'
                >
                  <SwitchControl class='bg-accent'>
                    <SwitchThumb />
                  </SwitchControl>
                </Switch>
              </div>
            </Tooltip>
          </div>
        </div>

        {props.rule && Object.keys(props.rule.conditions).length === 0 ? (
          <div class='text-center py-8 text-muted-foreground'>
            No conditions. Click "Edit Conditions" to start.
          </div>
        ) : (
          <div class='space-y-4 flex flex-col items-start overflow-y-auto h-full'>
            <For each={Object.entries(props.rule?.conditions)}>
              {([key, value]) => {
                const condition =
                  conditionTypes[key as keyof typeof conditionTypes];
                const EXCLUDED_OPERATORS = [Operator.GTE, Operator.LTE];
                const filteredOperators = operators.filter((op) => {
                  if (key === "sockets" && EXCLUDED_OPERATORS.includes(op)) {
                    return false;
                  }
                  return true;
                });
                if (!condition) return <></>;
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
