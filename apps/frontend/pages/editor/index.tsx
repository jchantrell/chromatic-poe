import { createSignal, Suspense } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { Categories } from "./components/categories";
import Visualiser from "./components/visual";
import { store } from "@app/store";

function Preview() {
  return (
    <div class='h-full'>
      <img
        class='object-cover overflow-hidden h-full w-full'
        alt='mountains'
        draggable='false'
        src={"packages/assets/preview-bg.jpg"}
      />
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
            {mode() === "hierarchy" && store.view ? (
              <Visualiser data={store.view} />
            ) : (
              <></>
            )}
            {mode() === "preview" ? <Preview /> : <></>}
          </ResizablePanel>
        </Resizable>
      </div>
    </>
  );
}

export default Editor;
