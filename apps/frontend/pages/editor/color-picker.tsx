import { createEffect, createSignal } from "solid-js";
import { store } from "@app/store";
import { setColor } from "@app/lib/filter";
import tinycolor from "tinycolor2";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "@pkgs/ui/slider";
import { Label } from "@pkgs/ui/label";

function ColorPicker(props: {
  label: string;
  key: "text" | "background" | "border";
}) {
  const [rgb, setRgb] = createSignal(
    store.activeRule?.actions[props.key] ?? { r: 0, g: 0, b: 0, a: 1 },
  );

  function handleInput(type: "rgb" | "alpha", value: string) {
    if (!store.filter || !store.activeRule) return;

    if (type === "rgb") {
      const color = tinycolor(value).toRgb();
      setColor(store.filter, store.activeRule, props.key, {
        r: color.r,
        g: color.g,
        b: color.b,
        a: rgb()?.a ?? 255,
      });
    }
    if (type === "alpha") {
      setColor(store.filter, store.activeRule, props.key, {
        ...rgb(),
        a: Number.parseInt(value),
      });
    }
  }

  createEffect(() => {
    setRgb(
      store.activeRule?.actions[props.key] ?? { r: 0, g: 0, b: 0, a: 255 },
    );
  });

  return (
    <div class='w-fit flex items-center flex-col'>
      <div class='flex w-full gap-1 items-center'>
        <Label class='w-20'>{props.label}</Label>
        <div class='flex items-center gap-1'>
          <input
            id={`${props.label}-color-picker`}
            onInput={(v) => {
              handleInput("rgb", v.target.value);
            }}
            type='color'
            class='opacity-0 w-0 h-0'
            value={`#${tinycolor(rgb()).toHex()}`}
          />
          <label
            class='flex w-full items-center gap-1'
            for={`${props.label}-color-picker`}
          >
            <div
              class='h-5 w-6 rounded-md border border-accent'
              style={{
                "background-color": `rgba(${rgb()?.r ?? 0}, ${rgb()?.g ?? 0}, ${rgb()?.b ?? 0}, 1)`,
              }}
            />
          </label>
          <div class='flex items-center justify-center gap-1 w-full ml-1'>
            <Label>Opacity</Label>
            <Slider
              class='w-[80px] ml-2'
              minValue={0}
              maxValue={255}
              step={1}
              value={[rgb()?.a ?? 255]}
              onChange={(v) => handleInput("alpha", v[0].toString())}
            >
              <SliderTrack class='bg-accent'>
                <SliderFill class='bg-neutral-400' />
                <SliderThumb class='size-4' />
              </SliderTrack>
            </Slider>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorPicker;
