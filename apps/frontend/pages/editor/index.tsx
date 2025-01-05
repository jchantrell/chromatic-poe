import { createEffect } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { useColorMode } from "@kobalte/core";
import { input } from "@app/lib/input";
import { store } from "@app/store";
import RuleEditor from "./rule-editor";
import Rules from "./rule-container";
import Preview from "./preview";
import {
  ESCAPE_KEY,
  REDO_KEY,
  SAVE_KEY,
  UNDO_KEY,
  WRITE_KEY,
} from "@app/constants";

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
        if (!store.filter) return;

        if (key === UNDO_KEY && event.ctrl && pressed) {
          return store?.filter?.undo();
        }

        if (key === REDO_KEY && event.ctrl && pressed) {
          return store?.filter?.redo();
        }

        if (key === SAVE_KEY && event.ctrl && pressed) {
          return store.filter?.save();
        }

        if (key === WRITE_KEY && event.ctrl && pressed) {
          return store.filter?.writeFile();
        }
      },
    );
  });
  return (
    <>
      {store.initialised && store.filter !== null && (
        <Resizable orientation='horizontal'>
          <ResizablePanel class='flex flex-col'>
            <Rules />
          </ResizablePanel>
          <ResizableHandle class='bg-primary-foreground' />
          <ResizablePanel class='overflow-y-auto'>
            <div
              class={`bg-no-repeat bg-center bg-cover size-full ${
                colorMode() === "dark"
                  ? "bg-[url('/static/bg-dark.jpg')]"
                  : "bg-[url('/static/bg-light.jpg')]"
              }`}
            >
              {store.activeRule ? <RuleEditor /> : <Preview />}
            </div>
          </ResizablePanel>
        </Resizable>
      )}
    </>
  );
}
