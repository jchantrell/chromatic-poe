import { createEffect, createSignal, For } from "solid-js";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { Collapsible, CollapsibleContent } from "@pkgs/ui/collapsible";
import {
  addParentRefs,
  getIcon,
  setEntryActive,
  type FilterRule,
} from "@app/lib/filter";
import { ChevronDownIcon } from "@pkgs/icons";
import Item from "./item";
import { store } from "@app/store";
import {
  type Draggable,
  type Droppable,
  SortableProvider,
  createDroppable,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";

function Rule(props: {
  rule: FilterRule;
}) {
  const [icon, setIcon] = createSignal(getIcon(props.rule));

  const [expanded, setExpanded] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const droppableTitle = createDroppable(props.rule.id, props.rule);

  const [_, { onDragEnd, onDragOver, onDragMove }] = useDragDropContext();

  createEffect(() => {
    setIcon(getIcon(props.rule));
  });

  createEffect(() => {
    addParentRefs(props.rule);
  });

  onDragMove(({ draggable }: { draggable: Draggable }) => {
    const draggableIsChild = props.rule.children.some(
      (e) => e.id === draggable.id,
    );
    if (droppableTitle.isActiveDroppable && !draggableIsChild) {
      setHovered(true);
    }
  });

  onDragOver(({ droppable }: { droppable: Droppable }) => {
    if (droppable && droppable.id !== props.rule.name) {
      setHovered(false);
    }
  });

  onDragEnd(() => {
    setHovered(false);
  });

  return (
    <Collapsible
      onOpenChange={(open) => setExpanded(open)}
      open={expanded()}
      ref={droppableTitle.ref}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            class={`p-1 border ${props.rule.enabled ? "text-primary" : "text-accent"} cursor-pointer h-full items-center flex justify-between select-none ${hovered() ? "border-accent" : "border-muted"}`}
            onMouseOut={() => setHovered(false)}
            onMouseOver={() => setHovered(true)}
            onFocus={() => null}
            onBlur={() => null}
            onMouseDown={(e: MouseEvent) => {
              if (e.button === 0 && !e.shiftKey) {
                return setExpanded(!expanded());
              }

              if (e.button === 0 && e.shiftKey) {
                store.filter?.execute(
                  setEntryActive(props.rule, !props.rule.enabled),
                );
              }
            }}
          >
            <div class='flex items-center justify-center min-w-max'>
              {icon() ? (
                <figure class='max-w-lg shrink-0'>
                  <img
                    class='mr-1 h-8 max-w-full pointer-events-none'
                    alt={`${props.rule.name} icon`}
                    src={icon()}
                  />
                </figure>
              ) : (
                <></>
              )}
              <div class='pointer-events-none text-xl p-1'>
                {props.rule.name}
              </div>
            </div>
            <div class='ml-1'>
              <ChevronDownIcon />
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class='w-48'>
            <ContextMenuItem
              onMouseDown={() =>
                store.filter?.execute(
                  setEntryActive(props.rule, !props.rule.enabled),
                )
              }
            >
              <span>{props.rule.enabled ? "Disable" : "Enable"}</span>
              <ContextMenuShortcut>⇧+LClick</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <span>Copy</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
      <CollapsibleContent>
        <ul
          class={`ms-6 border-s-[1px] border-r-0 flex flex-wrap ${hovered() ? "border-accent" : "border-muted"}`}
          onMouseOut={() => setHovered(false)}
          onMouseOver={() => setHovered(true)}
          onFocus={() => null}
          onBlur={() => null}
        >
          <SortableProvider ids={props.rule.children.map((e) => e.id)}>
            <For each={props.rule.children}>
              {(item) => {
                return <Item item={item} setHovered={setHovered} />;
              }}
            </For>
          </SortableProvider>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default Rule;
