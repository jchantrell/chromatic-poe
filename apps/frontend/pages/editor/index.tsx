import Background from "@app/components/background";
import { Loading } from "@app/components/loading";
import { REDO_KEY, SAVE_KEY, UNDO_KEY, WRITE_KEY } from "@app/constants";
import { input } from "@app/lib/input";
import { setFilter, store } from "@app/store";
import { Resizable, ResizableHandle, ResizablePanel } from "@app/ui/resizable";
import { useColorMode } from "@kobalte/core";
import { useParams } from "@solidjs/router";
import { createEffect } from "solid-js";
import { toast } from "solid-sonner";
import Preview from "./filter-preview";
import Rules from "./rule-container";
import RuleEditor from "./rule-editor";

export default function Editor() {
  const { colorMode } = useColorMode();
  const params = useParams();

  createEffect(() => {
    const filter = store.filters.find((entry) => entry.name === params.filter);
    setFilter(filter || null);
  });

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
          toast("Saving filter...");
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
      {store.filter ? (
        store.patchLoaded ? (
          <Resizable orientation='horizontal'>
            <ResizablePanel class='flex flex-col'>
              <Rules />
            </ResizablePanel>
            <ResizableHandle class='bg-primary-foreground' />
            <ResizablePanel>
              <div
                class={`bg-no-repeat bg-center bg-cover size-full relative ${
                  colorMode() === "dark"
                    ? "bg-[url('/static/bg-dark.jpg')]"
                    : "bg-[url('/static/bg-light.jpg')]"
                }`}
              >
                {store.activeRule ? <RuleEditor /> : <Preview />}
              </div>
              u
            </ResizablePanel>
          </Resizable>
        ) : (
          <Loading />
        )
      ) : (
        <Background>
          <div class='size-full flex justify-center items-center'>
            {store.initialised && `No existing filter named ${params.filter}`}
          </div>
        </Background>
      )}
    </>
  );
}
