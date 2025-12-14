import { Progress } from "@app/components/progress";
import { REDO_KEY, SAVE_KEY, UNDO_KEY, WRITE_KEY } from "@app/constants";
import { dat } from "@app/lib/dat";
import type { Item } from "@app/lib/filter";
import { input } from "@app/lib/input";
import { itemIndex } from "@app/lib/items";
import { type Mod, modIndex } from "@app/lib/mods";
import { to } from "@app/lib/utils";
import { setFilter, setPatchLoaded, store } from "@app/store";
import { Resizable, ResizableHandle, ResizablePanel } from "@app/ui/resizable";
import { useColorMode } from "@kobalte/core";
import { useParams } from "@solidjs/router";
import { createEffect, createSignal, onMount } from "solid-js";
import { toast } from "solid-sonner";
import Preview from "./filter-preview";
import Rules from "./rule-container";
import RuleEditor from "./rule-editor";

export default function Editor() {
  const [progress, setProgress] = createSignal(0);
  const [message, setMessage] = createSignal("Initializing...");
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

  createEffect(async () => {
    const currentVersions = store.poeCurrentVersions;
    if (!store.initialised || !store.filter || !currentVersions) return;
    setPatchLoaded(false);

    const filterVersion = store.filter.poePatch;

    const gameVersion = filterVersion.startsWith("3") ? 1 : 2;

    if (gameVersion === 1 && filterVersion !== currentVersions.poe1) {
      store.filter.poePatch = currentVersions.poe1;
    }
    if (gameVersion === 2 && filterVersion !== currentVersions.poe2) {
      store.filter.poePatch = currentVersions.poe2;
    }

    const patch = store.filter.poePatch;

    if (itemIndex.patch !== filterVersion) {
      itemIndex.searchIndex = null;
    }

    const [extractError] = await to(
      dat.extract(patch, (p, m) => {
        setProgress(p);
        setMessage(m);
      }),
    );
    if (extractError) {
      console.error("Failed to load items", extractError);
      return;
    }

    const [dataError, data] = await to(dat.load(patch));
    if (dataError) {
      console.error("Failed to load data", dataError);
      return;
    }

    if (gameVersion === 1) {
      itemIndex.initV1(data.items as Item[], patch);
    } else {
      itemIndex.initV2(data.items as Item[], patch);
    }
    modIndex.init(data.mods as Mod[]);

    setPatchLoaded(true);
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
            </ResizablePanel>
          </Resizable>
        ) : (
          <div class='size-full flex justify-center items-center'>
            <Progress progress={progress} message={message} />
          </div>
        )
      ) : (
        <div class='size-full flex justify-center items-center'>
          {store.initialised && `No existing filter named ${params.filter}`}
        </div>
      )}
    </>
  );
}
