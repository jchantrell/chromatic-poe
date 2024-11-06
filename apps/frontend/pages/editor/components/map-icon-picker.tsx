import { createEffect, createSignal, on, onMount } from "solid-js";
import { For } from "solid-js";
import { store } from "@app/store";
import { Color, colors, IconSize, Shape } from "@app/lib/filter";
import { Popover, PopoverContent, PopoverTrigger } from "@pkgs/ui/popover";
import minimapIcons from "@pkgs/assets/minimap.json";
import { RadioGroup, RadioGroupItem } from "@pkgs/ui/radio-group";

const SHEET_WIDTH = 896;
const SHEET_HEIGHT = 3072;

export function MinimapIcon(props: {
  size: IconSize;
  scale: number;
  color: Color;
  shape: Shape;
}) {
  return (
    <div
      style={{
        "background-image": "url(/spritesheets/Art@2DArt@Minimap@Player.png)",
        height: `calc(64px / ${props.scale})`,
        width: `calc(64px / ${props.scale})`,
        "background-position": `calc(-${minimapIcons[props.color][props.shape][props.size].x}px / ${props.scale}) calc(-${minimapIcons[props.color][props.shape][props.size].y}px / ${props.scale})`,
        "background-size": `calc(${SHEET_WIDTH}px / ${props.scale}) calc(${SHEET_HEIGHT}px / ${props.scale})`,
      }}
    />
  );
}

function MapIconPicker() {
  const [open, setOpen] = createSignal(false);
  const [scale, setScale] = createSignal(0);
  const [size, setSize] = createSignal<IconSize>(IconSize.Small);
  const [shape, setShape] = createSignal<Shape>(Shape.Circle);
  const [color, setColor] = createSignal<Color>(Color.Blue);

  const previewScale = 1.5;

  onMount(() => {
    window.addEventListener("resize", () => {
      setScale(window.devicePixelRatio * 1.5);
    });
    setScale(window.devicePixelRatio * 1.5);
  });

  createEffect(
    on(size, () => {
      if (store.activeRule?.actions.icon) {
        store.activeRule.actions.icon.size = size();
      }
    }),
  );
  createEffect(
    on(color, () => {
      if (store.activeRule?.actions.icon) {
        store.activeRule.actions.icon.color = color();
      }
    }),
  );
  createEffect(
    on(shape, () => {
      if (store.activeRule?.actions.icon) {
        store.activeRule.actions.icon.shape = shape();
      }
    }),
  );

  createEffect(() => {
    if (store.activeRule?.actions.icon) {
      setSize(store.activeRule.actions.icon?.size);
    }
  });

  return (
    <div class='w-fit flex items-center flex-col'>
      <Popover open={open()} onOpenChange={setOpen}>
        <div class='flex items-center w-full'>
          <div
            class='flex items-center justify-center'
            style={{
              height: `calc(64px / ${previewScale})`,
              width: `calc(64px / ${previewScale})`,
            }}
          >
            {store.activeRule?.actions.icon?.enabled ? (
              <PopoverTrigger>
                <MinimapIcon
                  scale={previewScale}
                  size={store.activeRule.actions.icon.size}
                  shape={store.activeRule.actions.icon.shape}
                  color={store.activeRule.actions.icon?.color}
                />
              </PopoverTrigger>
            ) : (
              ""
            )}
          </div>
        </div>
        <PopoverContent
          class='w-fit flex flex-col items-center p-1'
          onMouseLeave={() => setOpen(false)}
        >
          <div class='flex max-w-[200px]'>
            <div class='flex flex-col items-center'>
              <For each={Object.entries(minimapIcons[color()])}>
                {(shape) => (
                  <div
                    class='hover:bg-muted rounded-lg'
                    onMouseDown={() => {
                      setShape(shape[0] as Shape);
                    }}
                  >
                    <MinimapIcon
                      scale={scale()}
                      color={color()}
                      size={size()}
                      shape={shape[0] as Shape}
                    />
                  </div>
                )}
              </For>
            </div>
            <div class='flex flex-col w-full items-center justify-center py-1 mx-1'>
              <RadioGroup value={size()} onChange={setSize} class='flex'>
                <For each={[IconSize.Large, IconSize.Medium, IconSize.Small]}>
                  {(size) => <RadioGroupItem value={size} />}
                </For>
              </RadioGroup>
              <div class='grid gap-1 size-full mt-2'>
                <For each={colors}>
                  {(color) => {
                    return (
                      <button
                        class='h-full rounded-lg border border-accent'
                        type='button'
                        style={{ background: color.hex }}
                        onClick={() => {
                          setColor(color.name);
                        }}
                      />
                    );
                  }}
                </For>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default MapIconPicker;
