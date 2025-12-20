import { CloseIcon } from "@app/icons";
import { type ConditionKey, conditionTypes } from "@app/lib/condition";
import type { modIndex, SearchableMod } from "@app/lib/mods";
import { Badge } from "@app/ui/badge";
import { Button } from "@app/ui/button";
import { Checkbox } from "@app/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@app/ui/dialog";
import { Separator } from "@app/ui/separator";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@app/ui/slider";
import { Switch, SwitchControl, SwitchThumb } from "@app/ui/switch";
import { TextField, TextFieldInput } from "@app/ui/text-field";
import { ToggleGroup, ToggleGroupItem } from "@app/ui/toggle-group";
import { debounce } from "@solid-primitives/scheduled";
import { createMemo, createSignal, For, onMount } from "solid-js";

type FilteredConditionKey = Exclude<ConditionKey, ConditionKey.BASE_TYPE>;

export function SliderInput(props: {
  key: FilteredConditionKey;
  value: number;
  onChange: (value: number) => void;
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
      class='space-y-2 w-[160px]'
    >
      <TextField>
        <TextFieldInput
          type='number'
          class='text-center border border-accent h-7'
          value={props.value}
          onInput={(v) =>
            props.onChange(Number((v.target as HTMLInputElement).value))
          }
        />
      </TextField>
      <div class='flex w-[150px]'>
        <SliderTrack class='bg-accent'>
          <SliderFill class='bg-neutral-400' />
          <SliderThumb class='size-4' />
        </SliderTrack>
      </div>
    </Slider>
  );
}

export function SelectInput(props: {
  value: string[];
  key: FilteredConditionKey;
  index: typeof modIndex;
  groupKey: string;
  onChange: (value: string[]) => void;
}) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filteredGroups, setFilteredGroups] = createSignal<string[]>([]);
  const [filtered, setFiltered] = createSignal<SearchableMod[]>([]);
  const debouncedSetFiltered = debounce(setFiltered, 200);

  function handleClick(name: string) {
    if (!props.value.includes(name)) {
      props.onChange([...props.value, name]);
    } else {
      props.onChange(props.value.filter((v) => v !== name));
    }
  }

  createMemo(() => {
    debouncedSetFiltered(
      props.index
        .search(`${searchTerm()}`)
        .map((result) => result.item)
        .sort((a: SearchableMod, b: SearchableMod) =>
          a.type.localeCompare(b.type),
        ),
    );
  });

  createMemo(() => {
    setFilteredGroups(
      Array.from(
        new Set(filtered().map((entry) => entry[props.groupKey] as string)),
      ),
    );
  });

  onMount(() => {
    setFiltered(
      props.index
        .search(`${searchTerm()}`)
        .map((result) => result.item)
        .sort((a: SearchableMod, b: SearchableMod) =>
          a.type.localeCompare(b.type),
        ),
    );
  });

  return (
    <div class='flex'>
      <Dialog>
        <DialogTrigger
          variant='default'
          class='text-md font-semibold'
          as={Button<"button">}
        >
          Edit
        </DialogTrigger>
        <DialogContent class='sm:max-w-[600px] overflow-y-visible'>
          <DialogHeader>
            <DialogTitle>
              Selecting {conditionTypes[props.key].label} values
            </DialogTitle>
          </DialogHeader>
          <div class='py-2'>
            <TextField value={searchTerm()} onChange={(v) => setSearchTerm(v)}>
              <TextFieldInput
                type='text'
                placeholder={`Search for ${conditionTypes[props.key].label.toLowerCase()}...`}
              />
            </TextField>
          </div>
          <div class='h-[50vh] overflow-y-auto p-1'>
            <For each={filteredGroups()}>
              {(group) => {
                if (
                  !filtered().some((entry) => entry[props.groupKey] === group)
                ) {
                  return "";
                }
                return (
                  <div class='flex flex-col gap-1'>
                    <For
                      each={filtered().filter(
                        (entry) => entry[props.groupKey] === group,
                      )}
                    >
                      {(entry) => (
                        <div class='grid grid-cols-[150px_auto] gap-2'>
                          <div class='flex gap-2 items-center'>
                            <Checkbox
                              onClick={() => {
                                handleClick(entry.name);
                              }}
                              checked={props.value.includes(entry.name)}
                            />
                            <div>{entry.name}</div>
                          </div>
                          <div class='ml-1 text-xs text-neutral-400'>
                            <For each={entry.stats}>
                              {(statGroup, index) => (
                                <>
                                  <div>
                                    {statGroup
                                      .map((s) => s.description)
                                      .join(" and ")}
                                  </div>
                                  {index() !== entry.stats.length - 1 && (
                                    <Separator />
                                  )}
                                </>
                              )}
                            </For>
                          </div>
                          <div class='col-span-2'>
                            <Separator />
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
      <div class='max-h-32 mt-2 items-center grid grid-cols-2 gap-1 overflow-y-auto overflow-x-hidden rounded-md'>
        <For each={props.value}>
          {(v) => {
            return (
              <div class='flex justify-between items-center bg-muted rounded-md'>
                <Badge variant='secondary'>{v}</Badge>
                <Button
                  variant='ghost'
                  size='icon'
                  class='w-4 h-6 mr-1'
                  onClick={() => handleClick(v)}
                >
                  <CloseIcon />
                </Button>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

export function ToggleInput(props: {
  value: string[];
  key: FilteredConditionKey;
  onChange: (value: string[]) => void;
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
              <ToggleGroupItem class='border border-accent' value={option}>
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
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      checked={props.value}
      onChange={(checked) => props.onChange(checked)}
      class='flex items-center space-x-2'
    >
      <SwitchControl class='bg-accent'>
        <SwitchThumb class='bg-primary-foreground' />
      </SwitchControl>
    </Switch>
  );
}
