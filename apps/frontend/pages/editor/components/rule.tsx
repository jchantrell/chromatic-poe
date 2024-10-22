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
  SortableProvider,
  createDroppable,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";

function Items(props: { rule: FilterRule }) {
  const droppable = createDroppable(`${props.rule.name}-list`, props.rule); // rule list is droppable

  return (
    <ul
      class={`ms-6 borer-s-[1px] ps-1 ${props.rule.enabled ? "border-primary" : "border-accent"} flex flex-wrap gap-1 p-1`}
      ref={droppable.ref}
    >
      <SortableProvider ids={props.rule.children.map((e) => e.name)}>
        <For each={props.rule.children}>
          {(child) => {
            return <Item item={child} />;
          }}
        </For>
      </SortableProvider>
    </ul>
  );
}

function Rule(props: {
  rule: FilterRule;
}) {
  const [expanded, setExpanded] = createSignal(false);
  const [icon, setIcon] = createSignal(getIcon(props.rule));
  const droppable = createDroppable(`${props.rule.name}-title`, props.rule); // rule title is also droppable

  const [_, { onDragEnd }] = useDragDropContext();

  onDragEnd(() => {
    setTimeout(() => {
      // FIX: this is a hack
      // onDragEnd event is non-deterministic and doesnt play nicely with solid state
      // works for now I guess?
      setIcon(getIcon(props.rule));
    }, 5);
  });

  return (
    <Collapsible
      class='grid relative'
      onOpenChange={(open) => setExpanded(open)}
      open={expanded()}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={droppable.ref}
            class={`p-1 border ${props.rule.enabled ? "text-primary" : "text-accent"} cursor-pointer hover:border-primary h-full items-center flex justify-between select-none ${expanded() && props.rule.enabled ? "border-muted" : ""} ${expanded() && !props.rule.enabled ? "border-accent" : ""} ${droppable.isActiveDroppable ? "bg-muted" : ""}`}
            onMouseDown={(e: MouseEvent) => {
              if (e.button === 0 && !e.shiftKey) {
                return setExpanded(!expanded());
              }

              if (e.button === 0 && e.shiftKey) {
                setEntryActive(props.rule, !props.rule.enabled);
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
                setEntryActive(props.rule, !props.rule.enabled)
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
        <Items rule={props.rule} />
      </CollapsibleContent>
    </Collapsible>
  );
}

export default Rule;
