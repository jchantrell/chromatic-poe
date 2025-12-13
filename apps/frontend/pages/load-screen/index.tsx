import Background from "@app/components/background";
import { store } from "@app/store";
import { For } from "solid-js";
import CreateFilter from "./create-filter";
import ExistingFilter from "./existing-filter";
import ImportFilter from "./import-filter";
import Setup from "./initial-setup";

export default function LoadScreen() {
  return (
    <>
      {!store.initialised && <Setup />}
      {store.initialised && (
        <Background>
          <div class='flex justify-center items-center size-full'>
            <div class='bg-neutral-900/70 border-neutral-900/70 text-foreground w-full max-w-sm rounded-lg border p-4 grid gap-2 items-center z-0'>
              <div class='grid grid-cols-2 items-center gap-2'>
                <CreateFilter />
                <ImportFilter />
              </div>
              <ul class='max-w-sm rounded-lg grid gap-2 items-center'>
                <For each={store.filters}>
                  {(filter) => <ExistingFilter filter={filter} />}
                </For>
              </ul>
            </div>
          </div>
        </Background>
      )}
    </>
  );
}
