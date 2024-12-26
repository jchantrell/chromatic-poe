import { createMemo, createSignal } from "solid-js";
import { store } from "@app/store";
import ColorPickerPrimitive, { type ColorResult } from "@pkgs/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@pkgs/ui/popover";
import { Label } from "@pkgs/ui/label";
import { setColor } from "@app/lib/filter";

function ColorPicker(props: {
  label: string;
  key: "text" | "background" | "border";
}) {
  const [open, setOpen] = createSignal(false);

  const handleChange = (color: ColorResult) => {
    if (store.filter && store.activeRule) {
      setColor(store.filter, store.activeRule, props.key, color.rgb);
    }
  };

  const coverStyle = createMemo(() => {
    if (!store.activeRule) return {};
    return {
      "background-color": `rgba(${store.activeRule.actions[props.key].r}, ${store.activeRule.actions[props.key].g}, ${store.activeRule.actions[props.key].b}, ${store.activeRule.actions[props.key].a})`,
    };
  });

  return (
    <div class='w-fit flex items-center flex-col'>
      <Popover open={open()} onOpenChange={setOpen}>
        <div class='flex items-center'>
          <PopoverTrigger>
            <div
              class='h-5 w-5 rounded-md border border-accent'
              style={coverStyle()}
            />
          </PopoverTrigger>
          <Label class='ml-1' for='icon'>
            {props.label}
          </Label>
        </div>
        <PopoverContent
          class='flex justify-center p-0 w-fit'
          onMouseLeave={() => setOpen(false)}
        >
          <ColorPickerPrimitive
            color={store.activeRule?.actions[props.key]}
            onChange={handleChange}
            onChangeComplete={handleChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ColorPicker;
