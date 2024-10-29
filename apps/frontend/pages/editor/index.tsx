import { batch, createEffect, JSXElement, Suspense } from "solid-js";
import { Resizable, ResizableHandle, ResizablePanel } from "@pkgs/ui/resizable";
import { useColorMode } from "@kobalte/core";
import Setup from "./components/initial-setup";
import { LoadScreenMenu } from "./components/load-screen";
import { For } from "solid-js";
import { Separator } from "@pkgs/ui/separator";
import Crumbs from "./components/crumbs";
import Category from "./components/category";
import Rule from "./components/rule";
import { input } from "@app/lib/input";
import CreateRule from "./components/create-rule";
import { toast } from "solid-sonner";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  closestCenter,
  type Id,
  type Draggable,
  type Droppable,
  DragDropDebugger,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
import { store, setActiveView, setCrumbs } from "@app/store";
import {
  addParentRefs,
  Command,
  FilterItem,
  type FilterRule,
} from "@app/lib/filter";
import { unwrap } from "solid-js/store";
import { ItemVisual } from "./components/item";

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
    ></div>
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
          setActiveView(store.crumbs[store.crumbs.length - 2].view);
          setCrumbs(store.crumbs.slice(0, store.crumbs.length - 1));
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

  return (
    <>
      <Crumbs />
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
    </>
  );
}

function AutoRecomputeLayouts() {
  const [_, { onDragStart, recomputeLayouts }] = useDragDropContext();
  onDragStart(() => {
    recomputeLayouts();
  });
  return null;
}

function DragDrop(props: { children: JSXElement }) {
  //
  function getContainer(
    element: DraggableItem | DroppableContainer,
  ): FilterRule | null {
    if (element.data.type === "rule") {
      return element.data;
    }
    if (element.data.type === "item") {
      return element.data.parent;
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
    const draggableContainer = getContainer(draggable);
    const droppableContainer = getContainer(droppable);

    console.log(draggable.data.name, droppableContainer);

    if (
      droppableContainer &&
      draggableContainer &&
      (draggableContainer.id !== droppableContainer.id ||
        !onlyWhenChangingContainer)
    ) {
      const itemIds = droppableContainer.children.map((e) => e.id);
      let index = itemIds.indexOf(droppable.id as string);
      if (index === -1) index = itemIds.length;

      store.filter?.execute(
        new Command(() => {
          batch(() => {
            draggableContainer.children = draggableContainer.children.filter(
              (entry) => draggable.id !== entry.id,
            );
            droppableContainer.children = [
              ...droppableContainer.children.slice(0, index),
              { ...draggable.data, parent: droppableContainer },
              ...droppableContainer.children.slice(index),
            ];
          });
        }),
      );
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
              <ItemVisual item={draggable.data} />
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}

export function Editor() {
  return (
    <>
      {!store.initialised && <Setup />}
      {store.initialised && store.filter === null && <LoadScreenMenu />}
      {store.initialised && store.filter !== null && (
        <Resizable orientation='horizontal' class='min-h-max'>
          <ResizablePanel class='h-fit flex w-full flex-col'>
            <Suspense fallback={<>Loading...</>}>
              <DragDrop>
                <ItemHierarchy />
              </DragDrop>
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
