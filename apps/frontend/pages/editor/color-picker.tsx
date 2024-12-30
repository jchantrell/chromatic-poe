import { createEffect, createSignal } from "solid-js";
import { store } from "@app/store";
import { setColor } from "@app/lib/filter";
import tinycolor from "tinycolor2";

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
      <div id='color_wrapper'>
        <div class='flex gap-1 items-center'>
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
            class='flex items-center gap-1'
            for={`${props.label}-color-picker`}
          >
            <div
              class='h-5 w-5 rounded-md border border-accent'
              style={{
                "background-color": `rgba(${rgb()?.r ?? 0}, ${rgb()?.g ?? 0}, ${rgb()?.b ?? 0}, ${(rgb()?.a ?? 255) / 255})`,
              }}
            />
            <div>{props.label}</div>
          </label>
        </div>
        <input
          id={`${props.label}-color-picker-alpha`}
          class='w-full'
          value={rgb()?.a ?? 255}
          onInput={(v) => handleInput("alpha", v.target.value)}
          type='range'
          min='0'
          max='255'
          step='1'
        />
      </div>
    </div>
  );
}

export default ColorPicker;
