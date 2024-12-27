import Rule from "./rule";
import CreateRule from "./create-rule";
import { For } from "solid-js";
import { store } from "@app/store";

export default function Rules() {
  return (
    <div class='m-1 p-1 flex flex-col gap-2 overflow-y-auto'>
      <For each={store?.filter?.rules}>
        {(entry) => {
          return <Rule rule={entry} />;
        }}
      </For>
      <CreateRule />
    </div>
  );
}
