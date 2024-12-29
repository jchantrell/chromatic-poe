import { For } from "solid-js";
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

const conditionTypes = {
  height: {
    label: "Height",
    type: "slider",
    operators: true,
    min: 1,
    max: 4,
  },
  rarity: {
    label: "Rarity",
    type: "toggle",
    operators: false,
    options: ["Normal", "Magic", "Rare"],
  },
  corrupted: {
    label: "Corrupted",
    type: "checkbox",
    operators: false,
  },
};

const operators = [">=", "<=", "=", ">", "<"];

function Input(props: {
  type: string;
  value: string;
  onChange: (...rest: unknown[]) => void;
  config: { min: number; max: number; options: string[] };
}) {
  switch (props.type) {
    case "slider":
      return (
        <Slider
          minValue={1}
          maxValue={4}
          getValueLabel={(params) => {
            return `${params.values[0]}`;
          }}
          onChange={(v) => props.onChange(v)}
          class='space-y-1 w-[200px]'
        >
          <SliderValueLabel />
          <div class='flex w-full'>
            <SliderTrack>
              <SliderThumb />
            </SliderTrack>
          </div>
        </Slider>
      );

    case "range":
      return (
        <Slider
          minValue={1}
          maxValue={4}
          getValueLabel={(params) => {
            if (params.values[0] === params.values[1]) {
              return `${params.values[0]}`;
            }
            return `${params.values[0]} - ${params.values[1]}`;
          }}
          onChange={(v) => props.onChange(v)}
          class='space-y-1 w-[200px]'
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

    case "select":
      return (
        <select
          value={props.value || ""}
          onChange={(e) => props.onChange(e.target.value)}
          class='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          <option value=''>Select...</option>
          <For each={props.config.options}>
            {(option) => <option value={option}>{option}</option>}
          </For>
        </select>
      );

    case "toggle":
      return (
        <div class='space-y-2'>
          <ToggleGroup multiple>
            <For each={props.config.options}>
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

    case "checkbox":
      return (
        <Switch class='flex items-center space-x-2'>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      );

    default:
      return (
        <input
          type='text'
          value={props.value || ""}
          onChange={(e) => props.onChange(e.target.value)}
          class='w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
        />
      );
  }
}

const ConditionManager = () => {
  const [conditions, setConditions] = createStore([
    {
      name: "height",
      operator: ">",
      value: "",
    },
    {
      name: "rarity",
      value: "",
    },
    {
      name: "corrupted",
      value: "true",
    },
  ]);

  function addCondition() {
    setConditions((conditions) => [
      ...conditions,
      {
        name: Object.keys(conditionTypes)[0],
        operator: ">=",
        value: "",
      },
    ]);
  }

  function removeCondition(index: number) {
    setConditions((conditions) => conditions.filter((_, i) => i !== index));
  }

  function updateCondition(index: number, field: string, value: string) {
    setConditions(index, {
      [field]: value,
    });
  }

  return (
    <div class='mx-auto p-4'>
      <div class='space-y-4'>
        <div class='flex justify-between items-center'>
          <h2 class='text-xl font-semibold'>Conditions</h2>
          <button
            onClick={addCondition}
            type='button'
            class='flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
          >
            Add Condition
          </button>
        </div>

        {conditions.length === 0 ? (
          <div class='text-center py-8 text-muted-foreground'>
            No conditions added. Click "Add Condition" to start.
          </div>
        ) : (
          <div class='space-y-4 flex flex-col items-start'>
            <For each={conditions}>
              {(condition, index) => (
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div class='flex gap-4 items-start p-4 bg-neutral-500/50 rounded-lg'>
                      <div class='w-1/3'>
                        {conditionTypes[condition.name].label}
                      </div>

                      {conditionTypes[condition.name].operators ? (
                        <div class='w-full'>
                          <select
                            value={condition.operator}
                            onChange={(e) =>
                              updateCondition(
                                index(),
                                "operator",
                                e.target.value,
                              )
                            }
                            class='w-full px-3 py-2 bg-muted border rounded focus:outline-none focus:ring-2 focus:ring-accent-foreground'
                          >
                            <For each={operators}>
                              {(op) => <option value={op}>{op}</option>}
                            </For>
                          </select>
                        </div>
                      ) : (
                        <></>
                      )}

                      <div class='ml-2'>
                        <Input
                          type={conditionTypes[condition.name].type}
                          value={condition.value}
                          onChange={(value) => {
                            return updateCondition(index(), "value", value);
                          }}
                          config={conditionTypes[condition.name]}
                        />
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuPortal>
                    <ContextMenuContent class='w-48'>
                      <ContextMenuItem
                        onMouseDown={() => removeCondition(index())}
                      >
                        <span>Delete</span>
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenuPortal>
                </ContextMenu>
              )}
            </For>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionManager;
