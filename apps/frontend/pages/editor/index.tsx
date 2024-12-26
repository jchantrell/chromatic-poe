import { createEffect, type JSXElement } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { useColorMode } from "@kobalte/core";
import Setup from "./initial-setup";
import { LoadScreenMenu } from "./load-screen";
import { For } from "solid-js";
import Rule from "./rule";
import { input } from "@app/lib/input";
import CreateRule from "./create-rule";
import { toast } from "solid-sonner";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  closestCenter,
  type Id,
  type Draggable,
  type Droppable,
} from "@thisbeyond/solid-dnd";
import { store } from "@app/store";
import { moveItem, type FilterItem, type FilterRule } from "@app/lib/filter";
import { ItemVisual } from "./item";
import { RuleEditor } from "./rule-editor";
import { ItemPicker } from "./item-picker";

interface DraggableItem extends Draggable {
  id: string;
  data: FilterItem;
}
interface DroppableContainer extends Droppable {
  id: string;
  data: FilterRule;
}

function FilterPreview() {
  return <div class='size-full flex items-center justify-center'></div>;
}

function Preview() {
  const { colorMode } = useColorMode();
  return (
    <div
      class={`h-full bg-no-repeat bg-center bg-cover ${
        colorMode() === "dark"
          ? "bg-[url('/poe2/backgrounds/bg-dark.jpg')]"
          : "bg-[url('/poe2/backgrounds/bg-light.jpg')]"
      } bg-fixed`}
    >
      {store.activeRule ? <RuleEditor /> : <FilterPreview />}
    </div>
  );
}

const SAVE_KEY = "s";
const REDO_KEY = "y";
const UNDO_KEY = "z";
const ESCAPE_KEY = "Escape";

function DragDrop(props: { children: JSXElement }) {
  function getContainer(
    element: DraggableItem | DroppableContainer,
  ): FilterRule | null {
    if (element.data.type === "rule") {
      return element.data;
    }
    if (element.data.type === "item") {
      return element?.data.parent;
    }
    return null;
  }

  function isContainer(droppable: DroppableContainer): boolean {
    if (droppable.data.type === "rule") {
      return true;
    }
    return false;
  }

  const closestContainerOrItem = (
    draggable: DraggableItem,
    droppables: DroppableContainer[],
    context: { activeDroppableId: Id | null },
  ) => {
    const closestContainer = closestCenter(
      draggable,
      droppables.filter((droppable) => isContainer(droppable)),
      context,
    ) as DroppableContainer;
    if (closestContainer) {
      const childIds = closestContainer.data.children.map((e) => e.id);

      const closestItem = closestCenter(
        draggable,
        droppables.filter((droppable) => childIds.includes(droppable.id)),
        context,
      );

      if (!closestItem) {
        return closestContainer;
      }

      const container = getContainer(draggable);

      if (container && container.id !== closestContainer.data.id) {
        const isLastItem =
          childIds.indexOf(closestItem.id as string) === childIds.length - 1;

        if (isLastItem) {
          const belowLastItem =
            draggable.transformed.center.y > closestItem.transformed.center.y;

          if (belowLastItem) {
            return closestContainer;
          }
        }
      }
      return closestItem;
    }
  };

  const move = (
    draggable: DraggableItem,
    droppable: DroppableContainer,
    onlyWhenChangingContainer = true,
  ) => {
    const srcContainer = getContainer(draggable);
    const tarContainer = getContainer(droppable);

    if (
      tarContainer &&
      srcContainer &&
      (srcContainer.id !== tarContainer.id || !onlyWhenChangingContainer)
    ) {
      const itemIds = tarContainer.children.map((e) => e.id);
      let index = itemIds.indexOf(droppable.id);
      if (index === -1) index = itemIds.length;

      moveItem(store.filter, index, draggable, srcContainer, tarContainer);
    }
  };

  const onDragMove = ({
    draggable,
    droppable,
  }: { draggable: DraggableItem; droppable: DroppableContainer }) => {
    if (draggable && droppable) {
      move(draggable, droppable);
    }
  };

  const onDragEnd = ({
    draggable,
    droppable,
  }: { draggable: DraggableItem; droppable: DroppableContainer }) => {
    if (draggable && droppable) {
      move(draggable, droppable, false);
    }
  };

  return (
    <DragDropProvider
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      collisionDetector={closestContainerOrItem}
    >
      <DragDropSensors />
      {props.children}
      <DragOverlay>
        {(draggable) => {
          return (
            <div class='sortable'>
              <ItemVisual item={draggable?.data as FilterItem} />
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}

function ItemHierarchy() {
  createEffect(() => {
    input.on(
      "keypress",
      (
        key: string,
        pressed: boolean,
        event: { shift: boolean; alt: boolean; ctrl: boolean },
      ) => {
        if (key === UNDO_KEY && event.ctrl && pressed) {
          const actionsReverted = store?.filter?.undo();
          if (actionsReverted) {
            toast(`Undid ${actionsReverted} actions.`);
          }
        }

        if (key === REDO_KEY && event.ctrl && pressed) {
          const actionsRedone = store?.filter?.redo();
          if (actionsRedone) {
            toast(`Redid ${actionsRedone} actions.`);
          }
        }

        if (key === SAVE_KEY && event.ctrl && pressed) {
          store.filter?.writeFile();
          toast("Saved filter.");
        }

        if (key === ESCAPE_KEY) {
          store.activeRule = null;
        }
      },
    );
  });

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

export function Editor() {
  return (
    <>
      {!store.initialised && <Setup />}
      {store.initialised && store.filter === null && <LoadScreenMenu />}
      {store.initialised && store.filter !== null && (
        <Resizable orientation='horizontal' class='min-h-max'>
          <ResizablePanel class='flex w-full flex-col p-0'>
            <DragDrop>
              <ItemHierarchy />
            </DragDrop>
          </ResizablePanel>
          <ResizableHandle class='bg-primary-foreground' />
          <ResizablePanel>
            <Preview />
          </ResizablePanel>
        </Resizable>
      )}
    </>
  );
}

export default Editor;
