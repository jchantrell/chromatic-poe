import { batch, createEffect, createSignal, type JSXElement } from "solid-js";
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
} from "@thisbeyond/solid-dnd";
import { store, setActiveView, setCrumbs } from "@app/store";
import {
  Color,
  Command,
  IconSize,
  Shape,
  type FilterItem,
  type FilterRule,
} from "@app/lib/filter";
import { ItemVisual } from "./components/item";
import MapIconPicker from "@app/pages/editor/components/map-icon-picker";
import ColorPicker from "@app/pages/editor/components/color-picker";
import { Checkbox } from "@pkgs/ui/checkbox";
import { Label } from "@pkgs/ui/label";
import BeamPicker from "./components/beam-picker";

interface DraggableItem extends Draggable {
  id: string;
  data: FilterItem;
}
interface DroppableContainer extends Droppable {
  id: string;
  data: FilterRule;
}

function RuleEditor() {
  if (!store.activeRule) return <></>;
  const [mapIconActive, setMapIconActive] = createSignal(false);
  const [beamActive, setBeamActive] = createSignal(false);

  function handleMapIcon(enabled: boolean) {
    if (store.activeRule?.actions.icon) {
      store.activeRule.actions.icon.enabled = enabled;
    }
    if (store.activeRule && !store.activeRule?.actions.icon && enabled) {
      store.activeRule.actions.icon = {
        color: Color.Red,
        shape: Shape.Circle,
        size: IconSize.Small,
        enabled: true,
      };
    }
  }

  function handleBeam(enabled: boolean) {
    if (store.activeRule?.actions.beam) {
      store.activeRule.actions.beam.enabled = enabled;
    }
    if (store.activeRule && !store.activeRule?.actions.beam && enabled) {
      store.activeRule.actions.beam = {
        temp: false,
        color: Color.Red,
        enabled: true,
      };
    }
  }

  createEffect(() => {
    setMapIconActive(store.activeRule?.actions.icon?.enabled || false);
  });

  createEffect(() => {
    setBeamActive(store.activeRule?.actions.beam?.enabled || false);
  });

  return (
    <div class='size-full flex flex-col items-center p-10'>
      <div
        class='flex max-w-[300px] w-full items-center justify-between text-lg border-[1.5px]'
        style={{
          color: `rgba(${store.activeRule.actions.text.r}, ${store.activeRule.actions.text.g}, ${store.activeRule.actions.text.b}, ${store.activeRule.actions.text.a})`,
          "border-color": `rgba(${store.activeRule.actions.border.r}, ${store.activeRule.actions.border.g}, ${store.activeRule.actions.border.b}, ${store.activeRule.actions.border.a})`,
          "background-color": `rgba(${store.activeRule.actions.background.r}, ${store.activeRule.actions.background.g}, ${store.activeRule.actions.background.b}, ${store.activeRule.actions.background.a})`,
        }}
      >
        <MapIconPicker />
        <div class='text-center'>{store.activeRule.name}</div>
        <BeamPicker />
      </div>
      <div class='w-full flex-col flex gap-1.5 justify-center items-center mt-2'>
        <div class='flex gap-1.5'>
          <ColorPicker label='Text' key='text' />
          <ColorPicker label='Border' key='border' />
          <ColorPicker label='Background' key='background' />
        </div>
        <div class='flex gap-1.5'>
          <div class='flex text-nowrap'>
            <Checkbox
              id='icon'
              onChange={handleMapIcon}
              checked={mapIconActive()}
            />
            <Label class='ml-1' for='icon'>
              Map Icon
            </Label>
          </div>
          <div class='flex text-nowrap'>
            <Checkbox id='beam' onChange={handleBeam} checked={beamActive()} />
            <Label class='ml-1' for='beam'>
              Beam
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPreview() {
  return <div class='size-full flex items-center justify-center'>preview</div>;
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
      {store.activeRule ? <RuleEditor /> : <FilterPreview />}
    </div>
  );
}

const SAVE_KEY = "s";
const REDO_KEY = "y";
const UNDO_KEY = "z";
const BACK_KEY = "Backspace";
const ESCAPE_KEY = "Escape";

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

        if (key === ESCAPE_KEY) {
          store.activeRule = null;
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

      store.filter?.execute(
        new Command(() => {
          batch(() => {
            srcContainer.children = srcContainer.children.filter(
              (entry) => draggable.id !== entry.id,
            );
            tarContainer.children = [
              ...tarContainer.children.slice(0, index),
              { ...draggable.data, parent: tarContainer },
              ...tarContainer.children.slice(index),
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
              <ItemVisual item={draggable?.data as FilterItem} />
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
            <DragDrop>
              <ItemHierarchy />
            </DragDrop>
          </ResizablePanel>
          <ResizableHandle class='bg-secondary w-1' />
          <ResizablePanel>
            <Preview />
          </ResizablePanel>
        </Resizable>
      )}
    </>
  );
}

export default Editor;
