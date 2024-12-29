import Rule from "./rule-menu-entry";
import CreateRule from "./create-rule";
import { For } from "solid-js";
import { store } from "@app/store";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  closestCenter,
  type DragEvent,
} from "@thisbeyond/solid-dnd";
import { moveRule } from "@app/lib/filter";

export default function Rules() {
  function onDragEnd({ draggable, droppable }: DragEvent) {
    if (draggable && droppable && store.filter) {
      moveRule(store.filter, String(draggable.id), String(droppable.id));
    }
  }

  return (
    <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <DragDropSensors />
      <div class='p-1 flex flex-col gap-2'>
        <SortableProvider
          ids={store.filter?.rules.map((rule) => rule.id) ?? []}
        >
          <For each={store.filter?.rules}>{(rule) => <Rule rule={rule} />}</For>
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
