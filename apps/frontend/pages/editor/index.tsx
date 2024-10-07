import { createSignal, Suspense } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { Categories } from "./components/categories";
import Visualiser from "./components/visual";
import { useColorMode } from "@kobalte/core";

function Preview() {
  const { colorMode } = useColorMode();
  return (
    <div class='h-full'>
      {colorMode() === "light" ? (
        <img
          class='object-cover overflow-hidden h-full w-full'
          alt='city'
          draggable='false'
          src='images/editor-bg-light.jpg'
        />
      ) : (
        <></>
      )}
      {colorMode() === "dark" ? (
        <img
          class='object-cover overflow-hidden h-full w-full'
          alt='mountains'
          draggable='false'
          src='images/editor-bg-dark.jpg'
        />
      ) : (
        <></>
      )}
    </div>
  );
}

export function Editor() {
  const [mode, setMode] = createSignal<"hierarchy" | "preview">("preview");

  return (
    <>
      <div class='w-full h-full flex justify-center items-center flex-col'>
        <Resizable orientation='horizontal'>
          <ResizablePanel>
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
      </div>
    </>
  );
}

export default Editor;
