import Background from "@app/components/background";
import { Loading } from "@app/components/loading";
import { setFilter, store } from "@app/store";
import { useParams } from "@solidjs/router";
import { createEffect, For } from "solid-js";
import CreateFilter from "./create-filter";
import ExistingFilter from "./existing-filter";
import ImportFilter from "./import-filter";

export default function LoadScreen() {
  const params = useParams();

  createEffect(() => {
    const filter = store.filters.find((entry) => entry.name === params.filter);
    setFilter(filter || null);
  });

  return (
    <Background>
      <div class='flex justify-center items-center size-full'>
        <div class='bg-neutral-900/70 border-neutral-900/70 text-foreground w-full max-w-sm rounded-lg border p-4 grid gap-2 items-center z-0'>
          <div class='grid grid-cols-2 items-center gap-2'>
            <CreateFilter />
            <ImportFilter />
          </div>
          {store.initialised ? (
            <ul class='max-w-sm rounded-lg grid gap-2 items-center'>
              <For each={store.filters}>
                {(filter) => <ExistingFilter filter={filter} />}
              </For>
            </ul>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </Background>
  );
}
