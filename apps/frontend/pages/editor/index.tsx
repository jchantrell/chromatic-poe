import { createSignal, Suspense } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { Categories } from "./components/categories";
import Visualiser from "./components/visual";
import { useColorMode } from "@kobalte/core";
import { store } from "@app/store";
import Setup from "./components/initial-setup";
import { LoadScreenMenu } from "./components/load-screen";

function Preview() {
  const { colorMode } = useColorMode();
  return (
    <div
      class={`h-full bg-no-repeat bg-center bg-cover bg-[url('/images/editor-bg-${colorMode()}.jpg')] bg-fixed`}
    ></div>
  );
}

export function Editor() {
  const [mode, setMode] = createSignal<"hierarchy" | "preview">("preview");

  return (
    <>
      {!store.initialised ? <Setup /> : <></>}
      {store.initialised && !store.filter ? <LoadScreenMenu /> : <></>}
      {store.initialised && store.filter ? (
        <Resizable orientation='horizontal' class='min-h-max'>
          <ResizablePanel class='h-fit flex flex-col'>
            <Suspense fallback={<>Loading...</>}>
              <Categories />
            </Suspense>
          </ResizablePanel>
          <ResizableHandle class='bg-primary-foreground w-2' />
          <ResizablePanel>
            {mode() === "hierarchy" ? <Visualiser /> : <></>}
            {mode() === "preview" ? <Preview /> : <></>}
          </ResizablePanel>
        </Resizable>
      ) : (
        <></>
      )}
    </>
  );
}

export default Editor;
