import { TextField, TextFieldInput } from "@pkgs/ui/text-field";
import type { FuseResult } from "fuse.js";
import { createEffect, createSignal, For, type JSXElement } from "solid-js";

export interface Index {
  search<T>(...args: unknown[]): FuseResult<T>;
}

export default function Search(props: {
  index: Index;
  placeholder?: string;
  child: (...args: unknown[]) => JSXElement;
}) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<FuseResult<unknown>>();

  createEffect(() => {
    setSearchResults(props.index.search(`${searchTerm()}`));
  });
  return (
    <>
      <div>
        <TextField value={searchTerm()} onChange={setSearchTerm}>
          <TextFieldInput type='text' placeholder={props.placeholder ?? ""} />
        </TextField>
      </div>
      <ul>
        <For each={searchResults() ?? []}>
          {({ item }) => {
            return props.child({ item });
          }}
        </For>
      </ul>
    </>
  );
}
