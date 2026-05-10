import { Progress } from "@app/components/progress";
import { dat } from "@app/lib/dat";
import { fetchDataRelease } from "@app/lib/data-release";
import type { Item } from "@app/lib/filter";
import { itemIndex } from "@app/lib/items";
import { enchantIndex, type Mod, modIndex } from "@app/lib/mods";
import { to } from "@app/lib/utils";
import {
  setFilter,
  setIconSpritesheet,
  setPatchLoaded,
  store,
} from "@app/store";
import { Resizable, ResizableHandle, ResizablePanel } from "@app/ui/resizable";
import { useColorMode } from "@kobalte/core";
import { useParams } from "@solidjs/router";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { toast } from "solid-sonner";
import Preview from "./filter-preview";
import Rules from "./rule-container";
import RuleEditor from "./rule-editor";

export default function Editor() {
  const [progress, setProgress] = createSignal(0);
  const [message, setMessage] = createSignal("Initializing...");
  const { colorMode } = useColorMode();
  const params = useParams();
  let loadingPatch: string | null = null;

  createEffect(() => {
    const filter = store.filters.find(
      (entry) => entry.name === decodeURIComponent(params.filter),
    );
    setFilter(filter || null);
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

    if (loadingPatch === patch) return;
    loadingPatch = patch;
    console.log(`[editor] loading data for ${patch}`);

    if (itemIndex.patch !== filterVersion) {
      itemIndex.searchIndex = null;
    }

    let toastId: string | number | undefined;
    let hasShownToast = false;

    onCleanup(() => {
      if (toastId) toast.dismiss(toastId);
    });

    console.log("[editor] fetching data release...");
    const [dataError, data] = await to(
      fetchDataRelease(patch, (p, m) => {
        if (!hasShownToast) {
          toastId = toast(<Progress progress={progress} message={message} />, {
            duration: Infinity,
          });
          hasShownToast = true;
        }
        setProgress(p);
        setMessage(m);

        if (p === 100) {
          toast.dismiss(toastId);
          toastId = undefined;
        }
      }),
    );

    if (dataError) {
      console.error("[editor] failed to fetch data release", dataError);
      toast.error("Failed to load game data", {
        description:
          dataError instanceof Error ? dataError.message : String(dataError),
      });
      loadingPatch = null;
      return;
    }

    console.log(
      `[editor] data received: ${data.items.length} items, ${data.uniques.length} uniques, ${data.mods.length} mods`,
    );

    const allItems = [
      ...data.items,
      ...data.uniques.map((u) => ({
        name: u.name,
        enabled: true,
        base: u.base ?? "",
        category: u.category,
        class: u.class ?? "",
        type: u.type ?? "",
        score: u.score ?? 0,
        art: u.art ?? "",
        height: u.height ?? 0,
        width: u.width ?? 0,
        itemClass: u.itemClass ?? "",
        gemFx: u.gemFx,
      })),
    ] as Item[];

    const missingBase = data.uniques.filter((u) => !u.base);
    if (missingBase.length) {
      toast.warning(
        `Could not retrieve base types for ${missingBase.length} uniques. Cannot filter by base type for these items.`,
        {
          description: missingBase.map((u) => u.name).join(", "),
          duration: 10000,
        },
      );
    }

    dat.minimap.coords = data.minimap;

    const [artError] = await to(
      dat.ensureArtCached(patch, [
        { name: "minimap", art: "Art/2DArt/Minimap/Player.dds" },
      ]),
    );
    if (artError) {
      toast.error("Failed to load minimap assets", {
        description:
          artError instanceof Error ? artError.message : String(artError),
      });
    }
    const url = await dat.getArt("minimap");
    if (url) {
      const img = new Image();
      try {
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () =>
            rej(new Error("Failed to load minimap spritesheet"));
          img.src = url;
        });
        setIconSpritesheet({
          url,
          height: img.naturalHeight,
          width: img.naturalWidth,
        });
      } catch (err) {
        toast.error("Failed to render minimap spritesheet", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (gameVersion === 1) {
      itemIndex.initV1(allItems, patch);
    } else {
      itemIndex.initV2(allItems, patch);
    }
    modIndex.init(data.mods as Mod[]);
    enchantIndex.init(data.mods as Mod[]);

    setPatchLoaded(true);

    const itemArt = allItems.map((i) => ({ name: i.name, art: i.art }));
    let artToastId: string | number | undefined;
    setProgress(0);
    setMessage("Downloading assets...");
    dat.ensureArtCached(patch, itemArt, (p, m) => {
      if (!artToastId) {
        artToastId = toast(<Progress progress={progress} message={message} />, {
          duration: Infinity,
        });
      }
      setProgress(p);
      setMessage(m);
      if (p === 100 && artToastId) {
        toast.dismiss(artToastId);
        artToastId = undefined;
      }
    });
  });

  return (
    <>
      {store.filter ? (
        store.patchLoaded ? (
          <Resizable orientation='horizontal'>
            <ResizablePanel class='flex flex-col'>
              <Rules />
            </ResizablePanel>
            <ResizableHandle class='bg-secondary w-1.5' />
            <ResizablePanel>
              <div
                class={`bg-no-repeat bg-center bg-cover size-full relative ${
                  colorMode() === "dark"
                    ? "bg-[url('/bg-dark.jpg')]"
                    : "bg-[url('/bg-light.jpg')]"
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
