import { batch, createEffect, Suspense } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { useColorMode } from "@kobalte/core";
import { store } from "@app/store";
import Setup from "./components/initial-setup";
import { LoadScreenMenu } from "./components/load-screen";
import { For } from "solid-js";
import { Separator } from "@pkgs/ui/separator";
import Crumbs from "./components/crumbs";
import Category from "./components/category";
import Rule from "./components/rule";
import { input } from "@app/lib/input";
import CreateRule from "./components/create-rule";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  closestCenter,
  type Id,
  type Draggable,
  type Droppable,
} from "@thisbeyond/solid-dnd";
import { moveItem, type FilterItem, type FilterRule } from "@app/lib/filter";
import { toast } from "solid-sonner";

interface DraggableItem extends Draggable {
  id: string;
  data: FilterItem;
}
interface DroppableContainer extends Droppable {
  id: string;
  data: FilterRule;
}

function Preview() {
  const { colorMode } = useColorMode();
  return (
    <div
      class={`h-full bg-no-repeat bg-center bg-cover ${
        colorMode() === "dark"
          ? "bg-[url('/backgrounds/bg-dark.jpg')]"
          : "bg-[url('/backgrounds/bg-light.jpg')]"
      } bg-fixed`}
    >
      a
    </div>
  );
}

const SAVE_KEY = "s";
const REDO_KEY = "y";
const UNDO_KEY = "z";
const BACK_KEY = "Backspace";

function ItemHierarchy() {
  createEffect(() => {
    input.on(
      "keypress",
      (
        key: string,
        pressed: boolean,
        event: { shift: boolean; alt: boolean; ctrl: boolean },
      ) => {
        if (
          key === BACK_KEY &&
          store.filter &&
          store.crumbs.length > 1 &&
          pressed
        ) {
          store.activeView = store.crumbs[store.crumbs.length - 2].view;
          store.crumbs.pop();
        }

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
      },
    );
  });

  function getContainer(
    element: DraggableItem | DroppableContainer,
  ): FilterRule | null {
    if (element.data.type === "rule") {
      return store.rules[element.data.id];
    }
    if (element.data.type === "item") {
      return store.rules[element.data.parent];
    }
    return null;
  }

  function isContainer(droppable: DroppableContainer): boolean {
    if (store.rules[droppable.data.id]) {
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
      const childIds = store.rules[closestContainer.data.id].children.map(
        (e) => e.id,
      );

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
    const draggableContainer = getContainer(draggable);
    const droppableContainer = getContainer(droppable);

    if (
      droppableContainer &&
      draggableContainer &&
      (draggableContainer.id !== droppableContainer.id ||
        !onlyWhenChangingContainer) &&
      droppableContainer.type === "rule"
    ) {
      const itemIds = droppableContainer.children.map((e) => e.id);
      let index = itemIds.indexOf(droppable.id as string);
      if (index === -1) index = itemIds.length;

      const item = store.items[draggable.id];
      const src = store.rules[draggableContainer.id];
      const tar = store.rules[droppableContainer.id];

      console.log(item.parent.id);

      item.parent = tar;

      console.log(item.parent.id);
      store.filter?.execute(moveItem(item, src, tar, index));
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
    <>
      <Crumbs />
      <DragDropProvider
        onDragEnd={onDragEnd}
        collisionDetector={closestContainerOrItem}
      >
        <DragDropSensors />
        <div class='m-2 p-1 flex flex-col h-full gap-2'>
          <For each={store?.activeView?.children}>
            {(entry, i) => {
              if (store?.activeView?.type === "root") {
                return (
                  <>
                    <div class='flex h-auto flex-wrap gap-2'>
                      <For each={entry.children}>
                        {(child) => {
                          if (child.type === "category") {
                            return <Category category={child} />;
                          }
                        }}
                      </For>
                    </div>
                    {store?.activeView.children &&
                    i() < store.activeView.children.length - 1 ? (
                      <Separator />
                    ) : (
                      <></>
                    )}
                  </>
                );
              }
              switch (entry.type) {
                case "category":
                  return <Category category={entry} />;
                case "rule":
                  return <Rule rule={entry} />;
              }
            }}
          </For>
          {store.activeView?.children.some((e) => e.type === "rule") ? (
            <CreateRule />
          ) : (
            <></>
          )}
        </div>
        <DragOverlay>
          {(draggable) => {
            return <div class='sortable'>{draggable.id}</div>;
          }}
        </DragOverlay>
      </DragDropProvider>
    </>
  );
}

export function Editor() {
  return (
    <>
      {!store.initialised && <Setup />}
      {store.initialised && !store.filter && <LoadScreenMenu />}
      {store.initialised && store.filter && (
        <Resizable orientation='horizontal' class='min-h-max'>
          <ResizablePanel class='h-fit flex flex-col'>
            <Suspense fallback={<>Loading...</>}>
              <ItemHierarchy />
            </Suspense>
          </ResizablePanel>
          <ResizableHandle class='bg-primary-foreground w-2' />
          <ResizablePanel>
            <Preview />
          </ResizablePanel>
        </Resizable>
      )}
    </>
  );
}

export default Editor;
