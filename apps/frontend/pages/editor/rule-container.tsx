import Rule from "./rule-menu-entry";
import CreateRule from "./create-rule";
import { createEffect, createSignal, For } from "solid-js";
import { store } from "@app/store";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  closestCenter,
  type DragEvent,
} from "@thisbeyond/solid-dnd";
import { type FilterRule, moveRule } from "@app/lib/filter";
import Search, { type Index } from "@app/components/search";
import Fuse, { type FuseResult } from "fuse.js";
import { TextField, TextFieldInput } from "@pkgs/ui/text-field";

class RuleIndex implements Index {
  searchIndex!: Fuse<FilterRule>;

  constructor() {
    this.setRules([]);
  }

  setRules(rules: FilterRule[]) {
    const options = {
      keys: ["name", "bases.name", "bases.base"],
      useExtendedSearch: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 1,
      distance: 160,
      threshold: 0.6,
    };
    this.searchIndex = new Fuse(rules, options);
  }

  search(
    args: Parameters<typeof this.searchIndex.search>[0],
  ): FuseResult<FilterRule>[] {
    // handle empty search
    if (!args || (typeof args === "string" && !args.length)) {
      return this.searchIndex.search({ name: "!1234567890" });
    }
    return this.searchIndex.search(`'${args}`);
  }
}

const ruleIndex = new RuleIndex();

export default function Rules() {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [searchResults, setSearchResults] =
    createSignal<FuseResult<FilterRule>>();
  function onDragEnd({ draggable, droppable }: DragEvent) {
    if (draggable && droppable && store.filter) {
      moveRule(store.filter, String(draggable.id), String(droppable.id));
    }
  }

  createEffect(() => {
    ruleIndex.setRules(store.filter?.rules ?? []);
    setSearchResults(ruleIndex.search(`${searchTerm()}`));
  });

  return (
    <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <DragDropSensors />
      <div class='p-1 flex flex-col gap-2 overflow-y-auto'>
        <SortableProvider
          ids={store.filter?.rules.map((rule) => rule.id) ?? []}
        >
          <div>
            <TextField value={searchTerm()} onChange={setSearchTerm}>
              <TextFieldInput type='text' placeholder={"Search for rules..."} />
            </TextField>
          </div>
          <ul>
            <For each={searchResults() ?? []}>
              {({ item }) => {
                return <Rule rule={item} />;
              }}
            </For>
          </ul>
        </SortableProvider>
        <CreateRule />
      </div>
      <DragOverlay>
        {(draggable) => {
          if (!draggable) return null;
          return <div class='sortable'>{draggable.data.name}</div>;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}

// export default function Search(props: {
//   index: Index;
//   placeholder?: string;
//   child: (...args: unknown[]) => JSXElement;
// }) {
//   const [searchTerm, setSearchTerm] = createSignal("");
//   const [searchResults, setSearchResults] = createSignal<FuseResult<unknown>>();

//   createEffect(() => {
//     setSearchResults(props.index.search(`${searchTerm()}`));
//   });
//   return (
//     <>
//       <div>
//         <TextField value={searchTerm()} onChange={setSearchTerm}>
//           <TextFieldInput type='text' placeholder={props.placeholder ?? ""} />
//         </TextField>
//       </div>
//       <ul>
//         <For each={searchResults() ?? []}>
//           {({ item }) => {
//             return props.child({ item });
//           }}
//         </For>
//       </ul>
//     </>
//   );
// }
