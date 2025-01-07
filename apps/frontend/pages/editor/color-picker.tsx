import { createEffect, onMount } from "solid-js";
import { store } from "@app/store";
import { setColor } from "@app/lib/filter";
import { Label } from "@pkgs/ui/label";
import jscolor from "@eastdesire/jscolor";

function ColorPicker(props: {
  label: string;
  key: "text" | "background" | "border";
}) {
  let pickerRef: HTMLButtonElement;
  let picker: typeof jscolor;

  function handleInput() {
    if (!store.filter || !store.activeRule) return;

    // this is evil but it's the only way i found to make this lib work
    const { r, g, b, a } = this.channels;
    setColor(store.filter, store.activeRule, props.key, {
      r,
      g,
      b,
      a: a * 255,
    });
  }

  function updateColor() {
    const { r, g, b, a } = store.activeRule?.actions[props.key] ?? {
      r: 0,
      g: 0,
      b: 0,
      a: 240,
    };
    if (picker) {
      picker.fromRGBA(r, g, b, a / 255);
    }
  }

  createEffect(() => {
    if (store.activeRule?.actions[props.key]) {
      updateColor();
    }
  });

  onMount(() => {
    jscolor.presets.default = {
      ...jscolor.presets.dark,
      position: "right",
      borderColor: "#000000",
      previewPosition: "right",
      previewSize: 40,
      shadow: false,
      width: 150,
      alpha: true,
      onInput: handleInput,
      palette: [
        "#ffffff",
        "#000000",
        "#870014",
        "#ec1c23",
        "#ff7e26",
        "#fef100",
        "#22b14b",
        "#00a1e7",
        "#3f47cc",
        "#a349a4",
      ],
    };
    picker = new jscolor(pickerRef);
    updateColor();
  });

  return (
    <div class='w-fit flex items-center flex-col'>
      <div class='flex w-full gap-1 items-center'>
        <Label class='w-20'>{props.label}</Label>
        <div class='flex items-center gap-1'>
          <input class='rounded-sm w-10 h-5' ref={pickerRef} type='button'>
            ast
          </input>
        </div>
      </div>
    </div>
  );
}

export default ColorPicker;
