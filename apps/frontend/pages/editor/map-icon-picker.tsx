import { Color, colors, IconSize, Shape } from "@app/lib/action";
import {
  setMapIconColor,
  setMapIconShape,
  setMapIconSize,
} from "@app/lib/commands";
import { dat } from "@app/lib/dat";
import { store } from "@app/store";
import { Popover, PopoverContent, PopoverTrigger } from "@app/ui/popover";
import { RadioGroup, RadioGroupItem } from "@app/ui/radio-group";
import {
  createEffect,
  createResource,
  createSignal,
  For,
  on,
  onMount,
} from "solid-js";

const SHEET_WIDTH = 896;
const SHEET_HEIGHT = 3776;
const PREVIEW_SCALE = 2; // magic number

export function MinimapIcon(props: {
  sheet?: string;
  size: IconSize;
  scale: number;
  color: Color;
  shape: Shape;
}) {
  return (
    <div
      style={{
        "background-image": `url(${props.sheet})`,
        height: `calc(64px / ${props.scale})`,
        width: `calc(64px / ${props.scale})`,
        "background-position": `calc(-${dat.minimap.coords?.[props.color][props.shape][props.size].x}px / ${props.scale}) calc(-${dat.minimap.coords?.[props.color][props.shape][props.size].y}px / ${props.scale})`,
        "background-size": `calc(${SHEET_WIDTH}px / ${props.scale}) calc(${SHEET_HEIGHT}px / ${props.scale})`,
      }}
    />
  );
}

function MapIconPicker() {
  const [open, setOpen] = createSignal(false);
  const [scale, setScale] = createSignal(0);
  const [size, setSize] = createSignal<IconSize>(
    store.activeRule?.actions.icon?.size || IconSize.Small,
  );
  const [shape, setShape] = createSignal<Shape>(
    store.activeRule?.actions.icon?.shape || Shape.Circle,
  );
  const [color, setColor] = createSignal<Color>(
    store.activeRule?.actions.icon?.color || Color.Red,
  );
  const [sheet] = createResource(async () => {
    return await dat.getArt("minimap");
  });

  onMount(() => {
    window.addEventListener("resize", () => {
      setScale(window.devicePixelRatio * PREVIEW_SCALE);
    });
    setScale(window.devicePixelRatio * PREVIEW_SCALE);
  });

  createEffect(
    on(open, () => {
      setSize(store.activeRule?.actions.icon?.size || IconSize.Small);
      setShape(store.activeRule?.actions.icon?.shape || Shape.Circle);
      setColor(store.activeRule?.actions.icon?.color || Color.Blue);
    }),
  );

  createEffect(
    on(size, () => {
      if (store.filter && store.activeRule?.actions.icon) {
        setMapIconSize(store.filter, store.activeRule, size());
      }
    }),
  );
  createEffect(
    on(color, () => {
      if (store.filter && store.activeRule?.actions.icon) {
        setMapIconColor(store.filter, store.activeRule, color());
      }
    }),
  );
  createEffect(
    on(shape, () => {
      if (store.filter && store.activeRule?.actions.icon) {
        setMapIconShape(store.filter, store.activeRule, shape());
      }
    }),
  );

  return (
    <div class='w-fit flex items-center flex-col'>
      <Popover open={open()} onOpenChange={setOpen}>
        <div class='flex items-center w-full'>
          <div
            class='flex items-center justify-center'
            style={{
              height: `calc(64px / ${PREVIEW_SCALE})`,
              width: `calc(64px / ${PREVIEW_SCALE})`,
            }}
          >
            {store.activeRule?.actions.icon?.enabled ? (
              <PopoverTrigger class=''>
                <MinimapIcon
                  sheet={sheet()}
                  scale={PREVIEW_SCALE}
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
          class='w-fit flex flex-col items-center p-1 bg-neutral-900 border-accent'
          onMouseLeave={() => setOpen(false)}
        >
          <div class='flex max-w-[200px]'>
            <div class='flex flex-col items-center'>
              {dat.minimap?.coords?.[color()] ? (
                <For each={Object.entries(dat.minimap.coords[color()])}>
                  {(shape) => (
                    <div
                      class='hover:bg-muted rounded-lg'
                      onMouseDown={() => {
                        setShape(shape[0] as Shape);
                      }}
                    >
                      <MinimapIcon
                        sheet={sheet()}
                        scale={scale()}
                        color={color()}
                        size={size()}
                        shape={shape[0] as Shape}
                      />
                    </div>
                  )}
                </For>
              ) : (
                <div>Loading...</div>
              )}
            </div>
            <div class='flex flex-col w-full items-center justify-center py-1 mx-1'>
              <RadioGroup value={size()} onChange={setSize} class='flex'>
                <For each={[IconSize.Small, IconSize.Medium, IconSize.Large]}>
                  {(size) => <RadioGroupItem value={size} />}
                </For>
              </RadioGroup>
              <div class='grid gap-1 size-full mt-2'>
                <For each={Object.entries(colors)}>
                  {(color) => {
                    return (
                      <button
                        class='w-full rounded-lg border border-accent hover:border-primary'
                        type='button'
                        style={{ background: color[1] }}
                        onClick={() => {
                          setColor(color[0] as Color);
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
