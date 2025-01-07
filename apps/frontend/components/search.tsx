import { TextField, TextFieldInput } from "@pkgs/ui/text-field";
import type { FuseResult } from "fuse.js";
import { createEffect, createSignal, For } from "solid-js";

interface Index {
  art: { [key: string]: string };
  search<T>(...args: unknown[]): FuseResult<T>;
}

export default function Search(props: { index: Index }) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<FuseResult<unknown>>();

  createEffect(() => {
    setSearchResults(props.index.search(`${searchTerm()}`));
  });
  return (
    <>
      <TextField value={searchTerm()} onChange={setSearchTerm}>
        <TextFieldInput type='text' />
      </TextField>
      <ul>
        <For each={searchResults()}>
          {({ item }) => {
            return (
              <div class='flex p-1'>
                <figure class='max-w-lg'>
                  <img
                    class='mr-1 h-8 max-w-full pointer-events-none'
                    alt={`${item.name} icon`}
                    src={props.index.art[item.name]}
                  />
                </figure>
                <div>{item.name}</div>
              </div>
            );
          }}
        </For>
      </ul>
    </>
  );
}
