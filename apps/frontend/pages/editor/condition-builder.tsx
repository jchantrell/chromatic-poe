import { createEffect, createSignal, For, onMount } from "solid-js";
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
  type SearchableCondition,
  type ConditionGroup,
  ConditionKey,
  Operator,
  conditionGroupColors,
  conditionTypes,
  createCondition,
  conditionIndex,
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
  SelectInput,
  SliderInput,
  ToggleInput,
} from "./condition-inputs";
import { PlusIcon, TrashIcon } from "@pkgs/icons";
import { TextField, TextFieldInput } from "@pkgs/ui/text-field";
import { Separator } from "@pkgs/ui/separator";

const operators = [
  Operator.NONE,
  Operator.GTE,
  Operator.LTE,
  Operator.EXACT,
  Operator.GT,
  Operator.LT,
];

export default function ConditionManager(props: { rule: FilterRule }) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filteredConditions, setFilteredConditions] = createSignal<
    SearchableCondition[]
  >([]);
  const [filteredConditionGroups, setFilteredConditionGroups] = createSignal<
    ConditionGroup[]
  >([]);

  function addCondition(condition: ConditionKey) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        props.rule.conditions.push(createCondition(condition));
      });
    }
  }

  function updateCondition<T extends Conditions, K extends keyof T>(
    condition: T,
    key: K,
    value: T[K],
  ) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        condition[key] = value;
      });
    }
  }

  function removeCondition<T extends Conditions>(condition: T) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        props.rule.conditions = props.rule.conditions.filter(
          (c) => c !== condition,
        );
      });
    }
  }

  function toggleHidden(checked: boolean) {
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

  function getConditionCount(key: ConditionKey) {
    const count = props.rule.conditions.filter((c) => c.key === key).length;
    return count ? `(${count})` : "";
  }

  createEffect(() => {
    setFilteredConditions(
      conditionIndex.search(searchTerm()).map((result) => result.item),
    );
  });

  createEffect(() => {
    setFilteredConditionGroups(
      Array.from(
        new Set(filteredConditions().map((condition) => condition.group)),
      ),
    );
  });

  onMount(() => {
    conditionIndex.setConditions(
      Object.entries(conditionTypes).map(([key, value]) => ({
        key: key as ConditionKey,
        ...value,
      })),
    );

    setFilteredConditions(
      conditionIndex.search(`${searchTerm()}`).map((result) => result.item),
    );
  });

  return (
    <div class='mx-auto p-4 h-full'>
      <div class='space-y-4 flex flex-col size-full max-w-[650px]'>
        <div class='flex gap-5 items-center'>
          <Dialog>
            <DialogTrigger class='text-md font-semibold' as={Button<"button">}>
              Edit Items
            </DialogTrigger>
            <DialogContent class='sm:max-w-[600px] overflow-y-hidden'>
              <ItemPicker rule={props.rule} />
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger class='text-md font-semibold' as={Button<"button">}>
              Add Conditions
            </DialogTrigger>
            <DialogContent class='sm:max-w-[600px]'>
              <DialogHeader>
                <DialogTitle>Add Conditions to {props.rule?.name}</DialogTitle>
              </DialogHeader>
              <div class='py-2'>
                <TextField value={searchTerm()} onChange={setSearchTerm}>
                  <TextFieldInput
                    type='text'
                    placeholder='Search for conditions...'
                  />
                </TextField>
              </div>
              <div class='overflow-y-auto h-[50vh]'>
                <For each={filteredConditionGroups()}>
                  {(group) => {
                    if (
                      !filteredConditions().some(
                        (condition) => condition.group === group,
                      )
                    ) {
                      return <></>;
                    }
                    return (
                      <div class='flex flex-col gap-1 mb-2'>
                        <Label
                          class={`text-md h-4 mb-1 ${conditionGroupColors[group]}`}
                        >
                          {group}
                        </Label>
                        <Separator />
                        <For
                          each={filteredConditions().filter(
                            (condition) => condition.group === group,
                          )}
                        >
                          {(condition) => (
                            <div class='flex gap-2 items-center ml-1'>
                              <Button
                                onClick={() =>
                                  addCondition(condition.key as ConditionKey)
                                }
                                size='sm'
                                variant='secondary'
                              >
                                <PlusIcon />
                              </Button>
                              <div class='flex flex-col'>
                                <span class='text-md'>
                                  {condition.label}
                                  <span class='text-sm text-accent-foreground'>
                                    {" "}
                                    {getConditionCount(condition.key)}
                                  </span>
                                </span>
                                <span class='text-xs text-muted-foreground'>
                                  {condition.description}
                                </span>
                              </div>
                            </div>
                          )}
                        </For>
                      </div>
                    );
                  }}
                </For>
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
                    toggleHidden(checked);
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

        {props.rule && !props.rule.conditions.length ? (
          <div class='text-center py-8 text-muted-foreground'>
            No conditions. Click "Edit Conditions" to start.
          </div>
        ) : (
          <div class='space-y-4 flex flex-col items-start overflow-y-auto h-full'>
            <For each={props.rule.conditions}>
              {(condition) => {
                const conditionType = conditionTypes[condition.key];
                const EXCLUDED_OPERATORS = [Operator.GTE, Operator.LTE];
                const filteredOperators = operators.filter((op) => {
                  if (
                    condition.key === ConditionKey.SOCKETS &&
                    EXCLUDED_OPERATORS.includes(op)
                  ) {
                    return false;
                  }
                  return true;
                });
                if (!condition) return <></>;
                return (
                  <div class='flex gap-4 items-center justify-between p-4 bg-neutral-500/50 rounded-lg'>
                    <Label class='text-md text-nowrap'>
                      {conditionType.label}
                    </Label>

                    {"operator" in condition && condition.operator && (
                      <div class='w-full'>
                        <Select
                          value={condition.operator}
                          onChange={(value) => {
                            if (value) {
                              updateCondition(condition, "operator", value);
                            }
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
                      {conditionType.type === "slider" && (
                        <SliderInput
                          key={condition.key}
                          value={condition.value}
                          onChange={(v) => {
                            updateCondition(condition, "value", v);
                          }}
                        />
                      )}
                      {conditionType.type === "select" && (
                        <SelectInput
                          key={condition.key}
                          value={condition.value}
                          onChange={(v) => {
                            updateCondition(condition, "value", v);
                          }}
                        />
                      )}
                      {conditionType.type === "text-list" && (
                        <ToggleInput
                          key={condition.key}
                          value={condition.value}
                          onChange={(v) => {
                            updateCondition(condition, "value", v);
                          }}
                        />
                      )}
                      {conditionType.type === "checkbox" && (
                        <CheckboxInput
                          key={condition.key}
                          value={condition.value}
                          onChange={(v) => {
                            updateCondition(condition, "value", v);
                          }}
                        />
                      )}
                    </div>
                    <Button
                      variant='secondary'
                      onMouseDown={() => removeCondition(condition)}
                    >
                      <TrashIcon />
                    </Button>
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
