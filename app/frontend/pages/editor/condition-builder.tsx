import Tooltip from "@app/components/tooltip";
import { CloseIcon, PlusIcon } from "@app/icons";
import { excuteCmd } from "@app/lib/commands";
import {
  ConditionGroup,
  ConditionKey,
  type Conditions,
  conditionGroupColors,
  conditionTypes,
  createCondition,
  Operator,
} from "@app/lib/condition";
import type { FilterRule } from "@app/lib/filter";
import { modIndex } from "@app/lib/mods";
import { store } from "@app/store";
import { Button } from "@app/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@app/ui/dialog";
import { Label } from "@app/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";
import { Separator } from "@app/ui/separator";
import { Switch, SwitchControl, SwitchThumb } from "@app/ui/switch";
import { TextField, TextFieldInput } from "@app/ui/text-field";
import Fuse from "fuse.js";
import { createEffect, createMemo, createSignal, For } from "solid-js";
import {
  CheckboxInput,
  SelectInput,
  SliderInput,
  ToggleInput,
} from "./condition-inputs";
import { ItemPicker } from "./item-picker";

const options = {
  keys: ["label", "group", "description", "options"],
  useExtendedSearch: true,
  ignoreFieldNorm: true,
  minMatchCharLength: 1,
  distance: 160,
  threshold: 0.6,
};

type FilteredConditionKey = Exclude<ConditionKey, ConditionKey.BASE_TYPE>;

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
  const [filteredConditionGroups, setFilteredConditionGroups] = createSignal<
    ConditionGroup[]
  >([]);

  const searchIndex = createMemo(() => {
    return new Fuse(
      Object.entries(conditionTypes).map(([key, value]) => ({
        key: key as ConditionKey,
        ...value,
      })) || [],
      options,
    );
  });

  const filteredConditions = createMemo(() => {
    return searchIndex()
      .search(
        searchTerm() !== "" ? `'${searchTerm()}` : { label: "!1234567890" },
      )
      .map((result) => result.item);
  });

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

  function getIndex(key: ConditionKey) {
    switch (key) {
      case ConditionKey.EXPLICIT_MOD:
        return modIndex;
      default:
        throw new Error("Unspported condition key");
    }
  }

  function getGroupKey(key: ConditionKey) {
    switch (key) {
      case ConditionKey.EXPLICIT_MOD:
        return "type";
      default:
        throw new Error("Unspported condition key");
    }
  }

  createEffect(() => {
    setFilteredConditionGroups(
      Array.from(
        new Set(
          filteredConditions()
            .filter((condition) => condition.group !== ConditionGroup.UNUSED)
            .map((condition) => condition.group),
        ),
      ),
    );
  });

  return (
    <div class='space-y-2 flex flex-col w-full flex-1 min-h-0 overflow-hidden'>
      <div class='flex flex-wrap gap-3 items-center w-full bg-primary-foreground/20 border border-accent rounded-xl px-2 py-1'>
        <Dialog>
          <DialogTrigger class='text-md font-semibold' as={Button<"button">}>
            Edit Items
          </DialogTrigger>
          <DialogContent class='sm:max-w-[600px] overflow-y-visible'>
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
                    return "";
                  }
                  return (
                    <div class='flex flex-col gap-1 mb-2'>
                      <Label
                        class={`text-md h-4 mb-1 ${conditionGroupColors[group as keyof typeof conditionGroupColors]}`}
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
            <div class='flex items-center gap-1 justify-between'>
              <Label class='text-md font-semibold mr-5'>Show</Label>
              <Switch
                checked={props.rule?.show}
                onChange={(checked) => {
                  toggleHidden(checked);
                }}
                class='flex items-center'
              >
                <SwitchControl class='bg-accent'>
                  <SwitchThumb />
                </SwitchControl>
              </Switch>
            </div>
          </Tooltip>
          <Tooltip text='Continue to the next rule after this one'>
            <div class='flex items-center gap-1 justify-between'>
              <Label class='text-md font-semibold'>Continue</Label>
              <Switch
                checked={props.rule?.continue}
                onChange={(checked) => {
                  toggleContinue(checked);
                }}
                class='flex items-center'
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
        <div class='text-center py-8 text-muted-foreground'>No conditions.</div>
      ) : (
        <div class='space-y-2 pb-2 pr-1 flex flex-col items-start overflow-y-auto overflow-x-hidden w-full flex-1 min-h-0 scrollbar-thumb-neutral-600'>
          {props.rule.conditions.map((condition) => {
            const conditionType = conditionTypes[condition.key];
            if (!condition) return null;
            return (
              <div class='bg-primary-foreground border border-accent rounded-xl flex flex-wrap items-center px-2 w-full @container'>
                <div class='max-w-full @md:max-w-22 w-full px-2 pt-1'>
                  <Label class='text-md text-wrap font-bold'>
                    {conditionType.label}
                  </Label>
                </div>
                <div class='flex items-center p-0.5'>
                  {"operator" in condition && condition.operator && (
                    <Select
                      value={condition.operator}
                      onChange={(value) => {
                        if (value) {
                          updateCondition(condition, "operator", value);
                        }
                      }}
                      options={operators.filter((o) => o != "")}
                      itemComponent={(props) => (
                        <SelectItem item={props.item}>
                          {props.item.rawValue}
                        </SelectItem>
                      )}
                    >
                      <SelectTrigger class='w-[70px] bg-accent'>
                        <SelectValue<string>>
                          {(state) => state.selectedOption()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                  )}
                  <div class='p-2 ml-1'>
                    {conditionType.type === "slider" && (
                      <SliderInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as number}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "select" && (
                      <SelectInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as string[]}
                        index={getIndex(condition.key)}
                        groupKey={getGroupKey(condition.key)}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "text-list" && (
                      <ToggleInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as string[]}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "checkbox" && (
                      <CheckboxInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as boolean}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
