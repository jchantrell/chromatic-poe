import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { createSortable, useDragDropContext } from "@thisbeyond/solid-dnd";
import { getIcon, setEntryActive, type FilterItem } from "@app/lib/filter";
import { store } from "@app/store";
import { createEffect, createSignal, type Setter } from "solid-js";

export function ItemVisual(props: { item: FilterItem; class: string }) {
  return (
    <div
      class={`p-1 px-2 ${props.item.enabled ? "text-primary" : "text-accent"} border items-center flex select-none ${props.class}`}
    >
      <figure class='max-w-lg'>
        <img
          class='mr-1 h-8 max-w-full pointer-events-none'
          alt={`${props.item.name} icon`}
          src={props.item.icon}
        />
      </figure>
      <div class='pointer-events-none text-lg'>{props.item.name}</div>
    </div>
  );
}

function Item(props: {
  item: FilterItem;
  setHovered: Setter<boolean>;
}) {
  const [icon, setIcon] = createSignal(getIcon(props.item));
  const sortable = createSortable(props.item.id, props.item);

  const [_, { onDragMove }] = useDragDropContext();

  createEffect(() => {
    setIcon(getIcon(props.item));
  });

  onDragMove(({ draggable }) => {
    // const draggableIsChild = draggable.data.parent.children.some(
    //   (e) => e.id === draggable.id,
    // );
    if (sortable.isActiveDroppable) {
      props.setHovered(true);
    }
  });

  return (
    <li
      use:sortable
      classList={{
        "opacity-15": sortable.isActiveDraggable,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <ItemVisual
            class='hover:border-accent'
            item={props.item}
            onMouseDown={(e) => {
              if (e.button === 0 && e.shiftKey) {
                store.filter?.execute(
                  setEntryActive(props.item, !props.item.enabled),
                );
              }
            }}
          />
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class='w-48'>
            <ContextMenuItem
              onMouseDown={() =>
                store.filter?.execute(
                  setEntryActive(props.item, !props.item.enabled),
                )
              }
            >
              <span>{props.item.enabled ? "Disable" : "Enable"}</span>
              <ContextMenuShortcut>⇧+LClick</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    </li>
  );
}

export default Item;