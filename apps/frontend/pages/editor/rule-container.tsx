import Rule from "./rule";
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
      moveRule(store.filter, draggable.id, droppable.id);
    }
  }

  return (
    <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <DragDropSensors />
      <div class='m-1 p-1 flex flex-col gap-2 overflow-y-auto'>
        <SortableProvider ids={store.filter?.rules.map((rule) => rule.id)}>
          <For each={store.filter?.rules}>{(rule) => <Rule rule={rule} />}</For>
        </SortableProvider>
        <CreateRule />
      </div>
      <DragOverlay>
        {(draggable) => {
          return <div class='sortable'>{draggable.data.name}</div>;
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
