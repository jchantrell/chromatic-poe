import { Color, colors } from "@app/lib/action";
import { setBeamColor, setBeamTemp } from "@app/lib/commands";
import { isDefined } from "@app/lib/utils";
import { store } from "@app/store";
import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@app/ui/popover";
import { createEffect, createSignal, For } from "solid-js";

function BeamPicker() {
  const [open, setOpen] = createSignal(false);
  const [color, setColor] = createSignal<Color>(Color.Blue);
  const [temp, setTemp] = createSignal<boolean>(
    store.activeRule?.actions.beam?.temp || false,
  );

  createEffect(() => {
    if (store.activeRule?.actions.beam?.color) {
      setColor(store.activeRule.actions.beam.color);
    }
  });

  createEffect(() => {
    if (isDefined(store.activeRule?.actions.beam?.temp)) {
      setTemp(store.activeRule.actions.beam.temp);
    }
  });

  function handleChange(key: "temp" | "color", value: boolean | Color) {
    if (!store.filter || !store.activeRule) return;
    if (key === "temp" && typeof value === "boolean") {
      setBeamTemp(store.filter, store.activeRule, value);
    }
    if (key === "color" && typeof value !== "boolean") {
      setBeamColor(store.filter, store.activeRule, value);
    }
  }

  return (
    <div class='flex items-center flex-col'>
      <Popover open={open()} onOpenChange={setOpen}>
        <div class='flex items-center w-full'>
          <div
            class='flex items-center justify-center rounded-full'
            style={{
              height: "calc(64px / 1.5)",
              width: "calc(64px / 1.5)",
            }}
          >
            {store.activeRule?.actions.beam?.enabled ? (
              <PopoverTrigger class='size-full p-3'>
                <div
                  class='h-5 w-6 rounded-md border border-accent hover:border-primary cursor-pointer'
                  style={{ background: `${colors[color()]}` }}
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
            <div class='flex flex-col w-full items-center justify-center py-1 mx-1'>
              <div class='flex'>
                <Label>Temp</Label>
                <Checkbox
                  id='temp-beam'
                  class='ml-1'
                  onChange={() => handleChange("temp", !temp())}
                  checked={temp()}
                />
              </div>
              <div class='grid gap-1 size-full mt-2'>
                <For each={Object.entries(colors)}>
                  {(color) => {
                    return (
                      <button
                        class='w-full h-4 rounded-lg border border-accent hover:border-primary'
                        type='button'
                        style={{ background: color[1] }}
                        onClick={() => {
                          handleChange("color", color[0] as Color);
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

export default BeamPicker;
