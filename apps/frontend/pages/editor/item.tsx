import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { store } from "@app/store";
import { createSortable, useDragDropContext } from "@thisbeyond/solid-dnd";
import { setEntryActive, type FilterItem } from "@app/lib/filter";
import { createEffect, createSignal, type Setter } from "solid-js";

export function ItemVisual(props: { item: FilterItem; class?: string }) {
  return (
    <div
      class={`p-1 px-2 ${props.item.enabled ? "text-primary" : "text-accent"} cursor-pointer border items-center flex select-none ${props.class}`}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.button === 0 && e.shiftKey && store.filter) {
          setEntryActive(store.filter, props.item, !props.item.enabled);
        }
      }}
    >
      <figure class='max-w-lg'>
        <img
          class='mr-1 h-8 max-w-full pointer-events-none'
          alt={`${props.item.name} icon`}
          src={props.item.art}
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
  const sortable = createSortable(props.item.name, props.item);

  const [_, { onDragMove }] = useDragDropContext();

  function handleActive() {
    if (store.filter) {
      setEntryActive(store.filter, props.item, !props.item.enabled);
    }
  }

  onDragMove(({ draggable }) => {
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
          <ItemVisual class='hover:border-accent' item={props.item} />
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class='w-48'>
            <ContextMenuItem onMouseDown={handleActive}>
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
