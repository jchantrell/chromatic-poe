import { createSignal, Suspense } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { Categories } from "./components/categories";
import Visualiser from "./components/visual";
import { store } from "@app/store";
import { LoadScreenMenu } from "./components/load-screen";

export function Editor() {
  const [mode, setMode] = createSignal<"hierarchy" | "preview">("preview");

  return (
    <>
      <div class='w-full h-[calc(100%-0.5rem)] flex justify-center items-center flex-col'>
        {store.filter ? (
          <Resizable orientation='horizontal'>
            <ResizablePanel>
              <Suspense fallback={<>Loading...</>}>
                <Categories />
              </Suspense>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              {mode() === "hierarchy" && store.view ? (
                <Visualiser data={store.view} />
              ) : (
                <></>
              )}
              {mode() === "preview" ? <>preview</> : <></>}
            </ResizablePanel>
          </Resizable>
        ) : (
          <LoadScreenMenu />
        )}
      </div>
    </>
  );
}

export default Editor;
