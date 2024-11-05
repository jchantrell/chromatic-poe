import { createEffect, createSignal, For, onMount } from "solid-js";
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
import { MinimapIcon } from "./map-icon-picker";

function Rule(props: {
  rule: FilterRule;
}) {
  const [icon, setIcon] = createSignal(getIcon(props.rule));
  const [active, setActive] = createSignal<boolean>(false);
  const [expanded, setExpanded] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [previewWidth, setPreviewWidth] = createSignal(0);
  const droppableTitle = createDroppable(props.rule.id, props.rule);

  const [_, { onDragEnd, onDragOver, onDragMove }] = useDragDropContext();

  let previewRef: HTMLDivElement | null = null;

  function onMouseDown(e: MouseEvent) {
    if (e.button === 0 && !e.shiftKey) {
      store.activeRule = props.rule;
    }
    if (e.button === 0 && e.shiftKey) {
      store.filter?.execute(setEntryActive(props.rule, !props.rule.enabled));
    }
  }

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

  createEffect(() => {
    if (store.activeRule) {
      setActive(store.activeRule.id === props.rule.id);
    } else setActive(false);
  });

  createEffect(() => {
    setIcon(getIcon(props.rule));
  });

  createEffect(() => {
    addParentRefs(props.rule);
  });

  onMount(() => {
    if (!previewRef) return;

    const observer = new ResizeObserver((entries) => {
      setPreviewWidth(entries[0].contentRect.width);
    });

    observer.observe(previewRef);
    return () => observer.disconnect();
  });

  function getBorderColor(active: boolean, hovered: boolean) {
    if (active) {
      return "border-primary";
    }
    if (hovered) {
      return "border-accent";
    }
    return "border-muted";
  }

  return (
    <Collapsible
      onOpenChange={(open) => setExpanded(open)}
      open={expanded()}
      ref={droppableTitle.ref}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            class={`h-10 flex border ${props.rule.enabled ? "text-primary" : "text-accent"} cursor-pointer items-center justify-between select-none ${getBorderColor(active(), hovered())}`}
            onMouseOut={() => setHovered(false)}
            onMouseOver={() => setHovered(true)}
            onFocus={() => null}
            onBlur={() => null}
            onMouseDown={onMouseDown}
            ref={previewRef}
          >
            <div class='m-1 flex items-center min-w-max mr-10'>
              <figure class='max-w-lg shrink-0'>
                <img
                  class='mr-1 h-8 max-w-full pointer-events-none'
                  alt={`${props.rule.name} icon`}
                  src={icon()}
                />
              </figure>
              <div class='pointer-events-none text-xl p-1'>
                {props.rule.name}
              </div>
            </div>
            <div
              class={`flex h-full items-center justify-end ${previewWidth() > 520 ? "w-full" : ""}`}
            >
              <div
                class={`h-6 px-3 max-w-[300px] items-center justify-center border border-1 mr-1 ${previewWidth() > 520 ? "flex" : "hidden"}`}
                style={{
                  color: `rgba(${props.rule.actions.text.r}, ${props.rule.actions.text.g}, ${props.rule.actions.text.b}, ${props.rule.actions.text.a})`,
                  "border-color": `rgba(${props.rule.actions.border.r}, ${props.rule.actions.border.g}, ${props.rule.actions.border.b}, ${props.rule.actions.border.a})`,
                  "background-color": `rgba(${props.rule.actions.background.r}, ${props.rule.actions.background.g}, ${props.rule.actions.background.b}, ${props.rule.actions.background.a})`,
                }}
              >
                {props.rule.actions.icon?.enabled ? (
                  <MinimapIcon
                    scale={3}
                    size={props.rule.actions.icon.size}
                    shape={props.rule.actions.icon.shape}
                    color={props.rule.actions.icon?.color}
                  />
                ) : (
                  ""
                )}
                {
                  props.rule.children.reduce((a, b) => {
                    return a.name.length <= b.name.length ? a : b;
                  }).name
                }
              </div>
              <div
                class='hover:bg-muted flex items-center h-full p-1'
                onMouseDown={(e: MouseEvent) => {
                  e.stopPropagation();
                  if (e.button === 0 && !e.shiftKey) {
                    return setExpanded(!expanded());
                  }
                }}
              >
                <ChevronDownIcon />
              </div>
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
          onMouseDown={onMouseDown}
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
