import { createSignal, For } from "solid-js";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { Collapsible, CollapsibleContent } from "@pkgs/ui/collapsible";
import { getIcon, setEntryActive, type FilterRule } from "@app/lib/filter";
import { ChevronDownIcon } from "@pkgs/icons";
import Item from "./item";
import {
  type Draggable,
  type Droppable,
  SortableProvider,
  createDroppable,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
import { store } from "@app/store";

function Rule(props: {
  rule: FilterRule;
}) {
  const [expanded, setExpanded] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [icon, setIcon] = createSignal("");
  const droppableTitle = createDroppable(`${props.rule.id}-title`, {
    type: "rule",
    id: props.rule.id,
  });
  const droppableBody = createDroppable(`${props.rule.id}-list`, {
    type: "rule",
    id: props.rule.id,
  });

  const [_, { onDragEnd, onDragOver, onDragMove }] = useDragDropContext();

  onDragMove(({ draggable }: { draggable: Draggable }) => {
    const draggableIsChild = props.rule.children.some(
      (e) => e.id === draggable.id,
    );
    if (
      (droppableTitle.isActiveDroppable || droppableBody.isActiveDroppable) &&
      !draggableIsChild
    ) {
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
    setTimeout(() => {
      // FIX: this is a hack
      // onDragEnd event is non-deterministic and doesnt play nicely with solid state
      // works for now I guess?
      // setIcon(getIcon(props.rule));
    }, 5);
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
            class={`p-1 border ${props.rule.enabled ? "text-primary" : "text-accent"} cursor-pointer hover:border-primary h-full items-center flex justify-between select-none ${expanded() && props.rule.enabled ? "border-muted" : ""} ${expanded() && !props.rule.enabled ? "border-accent" : ""} ${hovered() ? "bg-muted" : ""}`}
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
                    src={icon() as string}
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
          class={`ms-6 borer-s-[1px] ps-1 ${props.rule.enabled ? "border-primary" : "border-accent"} flex flex-wrap gap-1 p-1`}
          ref={droppableBody.ref}
        >
          <SortableProvider ids={props.rule.children.map((e) => e.id)}>
            <For each={props.rule.children}>
              {(child) => {
                return <Item item={child} setHovered={setHovered} />;
              }}
            </For>
          </SortableProvider>
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default Rule;
