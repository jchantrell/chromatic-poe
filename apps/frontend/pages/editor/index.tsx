import { batch, Suspense } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { useColorMode } from "@kobalte/core";
import { store } from "@app/store";
import Setup from "./components/initial-setup";
import { LoadScreenMenu } from "./components/load-screen";
import { For, onMount } from "solid-js";
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
import type { FilterItem, FilterRule } from "@app/lib/filter";

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

function ItemHierarchy() {
  onMount(() => {
    input.on("keydown", (key: string) => {
      if (key === "Backspace" && store.filter && store.crumbs.length > 1) {
        store.view = store.crumbs[store.crumbs.length - 2].view;
        store.crumbs.pop();
      }
    });
  });

  function getContainer(
    element: DraggableItem | DroppableContainer,
  ): FilterRule | null {
    if (element.data.type === "rule") {
      return element.data;
    }
    if (element.data.type === "item" && element.data.parent) {
      return element.data.parent;
    }
    return null;
  }

  function isContainer(droppable: DroppableContainer): boolean {
    return droppable.data.type === "rule";
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
      const childIds = closestContainer.data.children.map((e) => e.name);

      const closestItem = closestCenter(
        draggable,
        droppables.filter((droppable) => childIds.includes(droppable.id)),
        context,
      );

      if (!closestItem) {
        return closestContainer;
      }

      const container = getContainer(draggable);

      if (container && container.name !== closestContainer.id) {
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
      (draggableContainer.name !== droppableContainer.name ||
        !onlyWhenChangingContainer) &&
      droppableContainer.type === "rule"
    ) {
      const itemIds = droppableContainer.children.map((e) => e.name);
      let index = itemIds.indexOf(droppable.id as string);
      if (index === -1) index = itemIds.length;

      batch(() => {
        draggableContainer.children = draggableContainer.children.filter(
          (item) => item.name !== draggable.id,
        );
        draggable.data.parent = undefined;
        droppableContainer.children = [
          ...droppableContainer.children.slice(0, index),
          { ...draggable.data, parent: droppableContainer },
          ...droppableContainer.children.slice(index),
        ];
      });
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
          <For each={store?.view?.children}>
            {(entry, i) => {
              if (store?.view?.type === "root") {
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
                    {store?.view.children &&
                    i() < store.view.children.length - 1 ? (
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
          {store.view?.children.some((e) => e.type === "rule") ? (
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
      {!store.initialised ? <Setup /> : <></>}
      {store.initialised && !store.filter ? <LoadScreenMenu /> : <></>}
      {store.initialised && store.filter ? (
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
      ) : (
        <></>
      )}
    </>
  );
}

export default Editor;
