import { CloseIcon } from "@app/icons";
import { type ConditionKey, conditionTypes } from "@app/lib/condition";
import type { enchantIndex, modIndex, SearchableMod } from "@app/lib/mods";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";
import { Separator } from "@app/ui/separator";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@app/ui/slider";
import { Switch, SwitchControl, SwitchThumb } from "@app/ui/switch";
import { TextField, TextFieldInput } from "@app/ui/text-field";
import { ToggleGroup, ToggleGroupItem } from "@app/ui/toggle-group";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { debounce } from "@solid-primitives/scheduled";
import { createEffect, createMemo, createSignal, For } from "solid-js";

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
  index: typeof modIndex | typeof enchantIndex;
  groupKey: string;
  onChange: (value: string[]) => void;
}) {
  let scrollRef: HTMLDivElement | undefined;
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filtered, setFiltered] = createSignal<SearchableMod[]>([]);
  const debouncedSetFiltered = debounce(setFiltered, 200);

  const selectedSet = createMemo(() => new Set(props.value));

  function handleClick(name: string) {
    if (!selectedSet().has(name)) {
      props.onChange([...props.value, name]);
    } else {
      props.onChange(props.value.filter((v) => v !== name));
    }
  }

  function runSearch(term: string) {
    return props.index
      .search(term)
      .map((result) => result.item)
      .sort((a: SearchableMod, b: SearchableMod) =>
        a.type.localeCompare(b.type),
      );
  }

  createEffect(() => {
    const term = searchTerm();
    debouncedSetFiltered(runSearch(term));
  });

  const virtualizer = createVirtualizer({
    get count() {
      return filtered().length;
    },
    getScrollElement: () => scrollRef ?? null,
    estimateSize: () => 40,
    overscan: 10,
  });

  // Seed initial results synchronously so the list isn't empty on open
  setFiltered(runSearch(""));

  return (
    <div class='flex'>
      <Dialog>
        <DialogTrigger
          variant='default'
          class='text-md font-semibold mr-1'
          as={Button<"button">}
        >
          Edit
        </DialogTrigger>
        <DialogContent class='sm:max-w-150 overflow-y-visible'>
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
          <div ref={scrollRef} class='h-[50vh] overflow-y-auto p-1'>
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const entry = filtered()[virtualRow.index];
                return (
                  <div
                    data-index={virtualRow.index}
                    ref={(el) =>
                      queueMicrotask(() => virtualizer.measureElement(el))
                    }
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div class='grid grid-cols-[150px_auto] gap-2'>
                      <div class='flex gap-2 items-center'>
                        <Checkbox
                          onClick={() => handleClick(entry.name)}
                          checked={selectedSet().has(entry.name)}
                        />
                        <div>{entry.name}</div>
                      </div>
                      <div class='ml-1 text-xs text-neutral-400'>
                        <For each={entry.stats}>
                          {(statGroup, index) => (
                            <>
                              <div>
                                {statGroup
                                  .map(
                                    (s: { description: string }) =>
                                      s.description,
                                  )
                                  .filter(Boolean)
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
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div class='max-h-32 p-1 flex flex-wrap gap-1 overflow-y-auto overflow-x-hidden rounded-md'>
        <For each={props.value}>
          {(v) => {
            return (
              <div class='flex w-fit justify-between items-center bg-accent rounded-md'>
                <Badge class='bg-accent' variant='secondary'>
                  {v}
                </Badge>
                <div class='flex'>
                  <Button
                    variant='ghost'
                    size='icon'
                    class='w-4 h-full mr-1 bg-accent min-h-0'
                    onClick={() => handleClick(v)}
                  >
                    <CloseIcon />
                  </Button>
                </div>
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

const SOCKET_COLORS = [
  { value: "R", label: "Red" },
  { value: "G", label: "Green" },
  { value: "B", label: "Blue" },
  { value: "A", label: "Abyss" },
  { value: "D", label: "Delve" },
  { value: "W", label: "White" },
] as const;

type SocketColor = (typeof SOCKET_COLORS)[number]["value"];

/** Parse a socket value like "5GGG" or "GGR" into {count, colors} */
function parseSocketValue(value: string): {
  count: number;
  colors: SocketColor[];
} {
  const match = value.match(/^(\d*)([RGBADW]*)$/i);
  if (!match) return { count: 1, colors: [] };
  const colors = (match[2]?.toUpperCase().split("") ?? []) as SocketColor[];
  const count = match[1]
    ? Math.max(1, Math.min(6, Number(match[1])))
    : Math.max(1, colors.length);
  return { count, colors };
}

/** Serialize {count, colors} back to "5GGG" */
function serializeSocketValue(count: number, colors: SocketColor[]): string {
  return `${count}${colors.join("")}`;
}

export function SocketInput(props: {
  value: string;
  key: FilteredConditionKey;
  onChange: (value: string) => void;
}) {
  const initial = parseSocketValue(props.value);
  const [count, setCount] = createSignal(initial.count);
  const [colors, setColors] = createSignal<SocketColor[]>(initial.colors);

  function emitChange(c: number, cols: SocketColor[]) {
    props.onChange(serializeSocketValue(c, cols));
  }

  function updateCount(raw: number) {
    const clamped = Math.max(1, Math.min(6, raw));
    const trimmed = colors().slice(0, clamped);
    setCount(clamped);
    setColors(trimmed);
    emitChange(clamped, trimmed);
  }

  function updateColor(index: number, color: string) {
    const current = [...colors()];
    if (!color) {
      current.splice(index);
    } else {
      current[index] = color as SocketColor;
    }
    setColors(current);
    emitChange(count(), current);
  }

  return (
    <div class='flex flex-col gap-1.5'>
      <SliderInput key={props.key} value={count()} onChange={updateCount} />
      <div class='flex gap-1.5 flex-wrap'>
        <SocketColorSelect index={0} colors={colors()} onSelect={updateColor} />
        {colors()[0] && (
          <SocketColorSelect
            index={1}
            colors={colors()}
            onSelect={updateColor}
          />
        )}
        {colors()[1] && (
          <SocketColorSelect
            index={2}
            colors={colors()}
            onSelect={updateColor}
          />
        )}
        {colors()[2] && (
          <SocketColorSelect
            index={3}
            colors={colors()}
            onSelect={updateColor}
          />
        )}
        {colors()[3] && (
          <SocketColorSelect
            index={4}
            colors={colors()}
            onSelect={updateColor}
          />
        )}
        {colors()[4] && (
          <SocketColorSelect
            index={5}
            colors={colors()}
            onSelect={updateColor}
          />
        )}
      </div>
    </div>
  );
}

function SocketColorSelect(props: {
  index: number;
  colors: SocketColor[];
  onSelect: (index: number, color: string) => void;
}) {
  return (
    <Select<string>
      value={props.colors[props.index] ?? ""}
      onChange={(v) => props.onSelect(props.index, v ?? "")}
      options={["", ...SOCKET_COLORS.map((c) => c.value)]}
      itemComponent={(itemProps) => (
        <SelectItem item={itemProps.item}>
          {itemProps.item.rawValue === ""
            ? "None"
            : (SOCKET_COLORS.find((c) => c.value === itemProps.item.rawValue)
                ?.label ?? itemProps.item.rawValue)}
        </SelectItem>
      )}
    >
      <SelectTrigger class='w-20 bg-accent h-7 text-xs'>
        <SelectValue<string>>
          {(state) => {
            const val = state.selectedOption();
            if (!val) return "None";
            return SOCKET_COLORS.find((c) => c.value === val)?.label ?? val;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}
