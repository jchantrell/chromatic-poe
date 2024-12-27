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
  deleteRule,
  setEntryActive,
  type FilterRule,
} from "@app/lib/filter";
import { ChevronDownIcon } from "@pkgs/icons";
import Item from "./item";
import { store } from "@app/store";
import { MinimapIcon } from "./map-icon-picker";
import { ItemPicker } from "./item-picker";
import { Dialog, DialogContent, DialogTrigger } from "@pkgs/ui/dialog";

function Rule(props: {
  rule: FilterRule;
}) {
  const [editNameActive, setEditNameActive] = createSignal(false);
  const [active, setActive] = createSignal<boolean>(false);
  const [expanded, setExpanded] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [previewWidth, setPreviewWidth] = createSignal(0);

  let previewRef: HTMLDivElement | undefined;

  function onMouseDown(e: MouseEvent) {
    e.stopPropagation();
    if (e.button === 0 && !e.shiftKey) {
      store.activeRule = props.rule;
    }
    if (e.button === 0 && e.shiftKey) {
      handleActive();
    }
  }

  function handleNameChange(e: Event) {
    props.rule.name = e.target.value;
  }

  function handleActive() {
    if (store.filter) {
      setEntryActive(store.filter, props.rule, !props.rule.enabled);
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    if (store.filter) {
      deleteRule(store.filter, props.rule);
    }
  }

  createEffect(() => {
    if (store.activeRule) {
      setActive(store.activeRule.id === props.rule.id);
    } else setActive(false);
  });

  createEffect(() => {
    addParentRefs([props.rule]);
  });

  createEffect(() => {
    setEditNameActive(store.activeRule?.id === props.rule.id);
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
      return "border-[#EEE]";
    }
    if (hovered) {
      return "border-accent";
    }
    return "border-muted";
  }

  return (
    <Dialog>
      <Collapsible
        onOpenChange={(open) => setExpanded(open)}
        open={expanded()}
        class='w-full'
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
                <div class='text-xl p-1'>
                  <input
                    class={`bg-primary-foreground outline-none border-none ${editNameActive() ? "pointer-events-auto" : "pointer-events-none"}`}
                    type='text'
                    value={props.rule.name}
                    onChange={handleNameChange}
                  />
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
                  {props.rule.bases.length
                    ? props.rule.bases.reduce((a, b) => {
                        return a.name.length <= b.name.length ? a : b;
                      }).name
                    : "Item"}
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
              <DialogTrigger
                as={ContextMenuItem}
                onClick={() => setExpanded(true)}
              >
                Edit Bases
              </DialogTrigger>
              <ContextMenuItem onMouseDown={handleActive}>
                <span>{props.rule.enabled ? "Disable" : "Enable"}</span>
                <ContextMenuShortcut>⇧+LClick</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem disabled>
                <span>Copy</span>
              </ContextMenuItem>
              <ContextMenuItem onMouseDown={handleDelete}>
                <span>Delete</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenuPortal>
        </ContextMenu>
        <CollapsibleContent>
          <ul
            class={`ms-6 border-s-[1px] grid border-r-0 ${hovered() ? "border-accent" : "border-muted"}`}
            onMouseOut={() => setHovered(false)}
            onMouseOver={() => setHovered(true)}
            onMouseDown={onMouseDown}
            onFocus={() => null}
            onBlur={() => null}
          >
            <For each={props.rule.bases}>
              {(entry) => <Item item={entry} setHovered={setHovered} />}
            </For>
          </ul>
        </CollapsibleContent>
        <DialogContent>
          <ItemPicker rule={props.rule} />
        </DialogContent>
      </Collapsible>
    </Dialog>
  );
}

export default Rule;
