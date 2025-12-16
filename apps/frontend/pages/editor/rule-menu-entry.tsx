import { ChevronDownIcon, ChevronUpIcon } from "@app/icons";
import {
  addParentRefs,
  deleteRule,
  duplicateRule,
  setEntryActive,
} from "@app/lib/commands";
import type { FilterRule } from "@app/lib/filter";
import { itemIndex } from "@app/lib/items";
import { store } from "@app/store";
import { Badge } from "@app/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@app/ui/context-menu";
import { Dialog, DialogContent, DialogTrigger } from "@app/ui/dialog";
import { createSortable, useDragDropContext } from "@thisbeyond/solid-dnd";
import { createEffect, createSignal, onMount } from "solid-js";
import { DropPreview } from "./drop-preview";
import { ItemPicker } from "./item-picker";

const MIN_PREVIEW_WIDTH = 500;

export default function Rule(props: {
  rule: FilterRule;
  expanded: boolean;
  setExpanded: (id: string, expanded: boolean) => void;
}) {
  const [editNameActive, setEditNameActive] = createSignal(false);
  const [selected, setSelected] = createSignal<boolean>(false);
  const [hovered, setHovered] = createSignal(false);
  const [previewWidth, setPreviewWidth] = createSignal(0);
  const sortable = createSortable(props.rule.id, props.rule);
  const [state] = useDragDropContext();

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

  function getBorderColor() {
    if (!props.rule.enabled) {
      return "";
    }
    if (hovered() || selected()) {
      return "border-2 border-accent";
    }

    return "border border-accent";
  }

  function getBgColor() {
    if (!props.rule.enabled) {
      return "bg-muted/50";
    }
    if (hovered() || selected()) {
      return "bg-secondary";
    }

    return "bg-muted";
  }

  function getTextColor() {
    if (!props.rule.enabled) {
      return "text-muted-foreground/20";
    }
    if (hovered() || selected()) {
      return "text-foreground";
    }
    return "text-foreground/80";
  }

  function handleNameChange(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      props.rule.name = e.target.value;
    }
  }

  function handleActive() {
    if (store.filter) {
      setEntryActive(store.filter, props.rule, !props.rule.enabled);
    }
  }

  function handleDuplicate(_: MouseEvent) {
    if (store.filter) {
      duplicateRule(store.filter, props.rule);
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
      setSelected(store.activeRule.id === props.rule.id);
    } else setSelected(false);
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

  return (
    <div
      use:sortable
      class='sortable'
      classList={{
        "opacity-25": sortable.isActiveDraggable,
        "transition-transform": !!state.active.draggable,
      }}
    >
      <Dialog>
        <ContextMenu>
          <ContextMenuTrigger>
            <div>
              <div
                class={`h-12 w-full flex cursor-pointer items-center justify-between text-accent-foreground select-none ${getBgColor()} ${getTextColor()} ${getBorderColor()} ${props.expanded ? "sticky top-0" : ""}`}
                onMouseOut={() => setHovered(false)}
                onMouseOver={() => setHovered(true)}
                onFocus={() => null}
                onBlur={() => null}
                ref={previewRef}
              >
                <div class='m-1 flex items-center w-full'>
                  <div
                    class='text-xl p-1 flex w-full items-center'
                    onMouseUp={onMouseDown}
                  >
                    <div
                      class={`w-16 flex items-center mr-1 ${props.rule.enabled ? "" : "grayscale"}`}
                    >
                      {props.rule.show ? (
                        <Badge variant='success'>Show</Badge>
                      ) : (
                        <Badge variant='error'>Hide</Badge>
                      )}
                    </div>
                    <input
                      class={`bg-transparent py-1 px-2 border-none field-sizing-content ${editNameActive() ? "pointer-events-auto" : "pointer-events-none"} `}
                      type='text'
                      value={props.rule.name}
                      onChange={handleNameChange}
                    />
                  </div>
                </div>
                <div class='flex items-center max-w-min'>
                  <div
                    class={`flex text-nowrap items-center justify-center border mr-1 ${props.rule.enabled ? "" : "grayscale"}`}
                    style={{
                      display:
                        previewWidth() >= MIN_PREVIEW_WIDTH ? "flex" : "none",
                    }}
                  >
                    <DropPreview rule={props.rule} showIcon iconScale={3} />
                  </div>
                  <div
                    class={`flex items-center h-11 p-1 ${!props.rule.bases.length ? "opacity-0" : "hover:text-accent-foreground/60"}`}
                    onMouseDown={(e: MouseEvent) => {
                      e.stopPropagation();
                      if (!props.rule.bases.length) return;
                      if (e.button === 0 && !e.shiftKey) {
                        props.setExpanded(props.rule.id, !props.expanded);
                      }
                    }}
                  >
                    {props.expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </div>
                </div>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuContent class='w-48'>
              <DialogTrigger
                as={ContextMenuItem}
                disabled={!itemIndex.searchIndex}
              >
                <div class='flex justify-between items-center w-full'>
                  Edit Items
                </div>
              </DialogTrigger>
              <ContextMenuItem onMouseDown={handleActive}>
                <span>{props.rule.enabled ? "Disable" : "Enable"}</span>
                <ContextMenuShortcut>⇧+LClick</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onMouseDown={handleDuplicate}>
                <span>Duplicate</span>
              </ContextMenuItem>
              <ContextMenuItem onMouseDown={handleDelete}>
                <span>Delete</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenuPortal>
        </ContextMenu>

        <DialogContent class='sm:max-w-[600px] overflow-y-visible'>
          <ItemPicker rule={props.rule} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
