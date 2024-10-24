import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { getIcon, setEntryActive, type FilterItem } from "@app/lib/filter";
import { createSortable, useDragDropContext } from "@thisbeyond/solid-dnd";
import type { Setter } from "solid-js";

function Item(props: {
  item: FilterItem;
  setHovered: Setter<boolean>;
}) {
  const icon = getIcon(props.item);
  const sortable = createSortable(props.item.name, props.item);

  const [_, { onDragMove }] = useDragDropContext();

  onDragMove(({ draggable }) => {
    const draggableIsChild = props.item.parent.children.some(
      (e) => e.name === draggable.id,
    );
    if (sortable.isActiveDroppable && !draggableIsChild) {
      props.setHovered(true);
    }
  });

  return (
    <li use:sortable classList={{ "opacity-25": sortable.isActiveDraggable }}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onMouseDown={(e) => {
              if (e.button === 0 && e.shiftKey) {
                setEntryActive(props.item, !props.item.enabled);
              }
            }}
            class={`p-1 px-2 ${props.item.enabled ? "text-primary" : "text-accent"} border border-primary-foreground hover:border-accent items-center flex select-none`}
          >
            {icon ? (
              <figure class='max-w-lg'>
                <img
                  class='mr-1 h-8 max-w-full pointer-events-none'
                  alt={`${props.item.name} icon`}
                  src={icon}
                />
              </figure>
            ) : (
              <></>
            )}
            <div class='pointer-events-none text-lg'>{props.item.name}</div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class='w-48'>
            <ContextMenuItem
              onMouseDown={() =>
                setEntryActive(props.item, !props.item.enabled)
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
