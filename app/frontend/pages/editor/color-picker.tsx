import Tooltip from "@app/components/tooltip";
import { DEFAULT_STYLE } from "@app/lib/action";
import { setColor, setColorEnabled } from "@app/lib/commands";
import { store } from "@app/store";
import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";
import jscolor from "@eastdesire/jscolor";
import { createEffect, onMount } from "solid-js";

/** Default preview colors shown when a color is not explicitly set. */
const PICKER_DEFAULTS: Record<
  "text" | "background" | "border",
  { r: number; g: number; b: number; a: number }
> = {
  text: DEFAULT_STYLE.text,
  background: DEFAULT_STYLE.background,
  border: { r: 0, g: 0, b: 0, a: 0 },
};

function ColorPicker(props: {
  label: string;
  key: "text" | "background" | "border";
}) {
  let pickerRef: HTMLButtonElement;
  let picker: typeof jscolor;

  const isActive = () => store.activeRule?.actions[props.key]?.enabled ?? false;

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
    const color = store.activeRule?.actions[props.key];
    const { r, g, b, a } = color ?? PICKER_DEFAULTS[props.key];
    if (picker) {
      picker.fromRGBA(r, g, b, a / 255);
    }
  }

  function handleToggle(enabled: boolean) {
    if (!store.filter || !store.activeRule) return;

    if (enabled && !store.activeRule.actions[props.key]) {
      // First activation — set to the default color
      const def = PICKER_DEFAULTS[props.key];
      setColor(store.filter, store.activeRule, props.key, { ...def });
    } else {
      // Toggle enabled flag, preserving the stored color
      setColorEnabled(store.filter, store.activeRule, props.key, enabled);
    }
  }

  createEffect(() => {
    // Re-run when the active rule or its color changes
    if (store.activeRule) {
      const _ = store.activeRule.actions[props.key];
      updateColor();
    }
  });

  onMount(() => {
    jscolor.presets.default = {
      ...jscolor.presets.dark,
      position: "bottom",
      borderColor: "#000000",
      previewPosition: "left",
      previewSize: 40,
      shadow: false,
      width: 150,
      alpha: true,
      hash: false,
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
        <Checkbox class='mr-1' checked={isActive()} onChange={handleToggle} />
        <Tooltip text='Accepts HEX and RGBA values'>
          <div class='flex items-center gap-1'>
            <input
              id={props.label}
              class='rounded-sm w-36 h-5 bg-muted border border-accent p-1 cursor-pointer'
              classList={{ "opacity-40 pointer-events-none": !isActive() }}
              ref={pickerRef}
              value={picker ? picker.toHEXAString() : "#FFFFFFFF"}
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

export default ColorPicker;
