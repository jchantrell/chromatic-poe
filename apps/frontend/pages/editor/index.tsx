import { createEffect } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { useColorMode } from "@kobalte/core";
import { input } from "@app/lib/input";
import { toast } from "solid-sonner";
import { store } from "@app/store";
import LoadScreen from "./load-screen";
import Setup from "./initial-setup";
import RuleEditor from "./rule-editor";
import Rules from "./rule-container";
import Preview from "./preview";

const SAVE_KEY = "s";
const REDO_KEY = "y";
const UNDO_KEY = "z";
const ESCAPE_KEY = "Escape";

export default function Editor() {
  const { colorMode } = useColorMode();

  createEffect(() => {
    input.on(
      "keypress",
      (
        key: string,
        pressed: boolean,
        event: { shift: boolean; alt: boolean; ctrl: boolean },
      ) => {
        if (key === UNDO_KEY && event.ctrl && pressed) {
          const actionsReverted = store?.filter?.undo();
          if (actionsReverted) {
            toast(`Undid ${actionsReverted} actions.`);
          }
        }

        if (key === REDO_KEY && event.ctrl && pressed) {
          const actionsRedone = store?.filter?.redo();
          if (actionsRedone) {
            toast(`Redid ${actionsRedone} actions.`);
          }
        }

        if (key === SAVE_KEY && event.ctrl && pressed) {
          store.filter?.writeFile();
          toast("Saved filter.");
        }

        if (key === ESCAPE_KEY) {
          store.activeRule = null;
        }
      },
    );
  });
  return (
    <>
      {!store.initialised && <Setup />}
      {store.initialised && store.filter === null && <LoadScreen />}
      {store.initialised && store.filter !== null && (
        <Resizable orientation='horizontal' class='min-h-max'>
          <ResizablePanel class='flex w-full flex-col p-0'>
            <Rules />
          </ResizablePanel>
          <ResizableHandle class='bg-primary-foreground' />
          <ResizablePanel>
            <div
              class={`h-full bg-no-repeat bg-center bg-cover ${
                colorMode() === "dark"
                  ? "bg-[url('/poe2/backgrounds/bg-dark.jpg')]"
                  : "bg-[url('/poe2/backgrounds/bg-light.jpg')]"
              } bg-fixed`}
            >
              {store.activeRule ? <RuleEditor /> : <Preview />}
            </div>
          </ResizablePanel>
        </Resizable>
      )}
    </>
  );
}
