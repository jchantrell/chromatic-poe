import { ChevronDownIcon, ChevronUpIcon } from "@app/icons";
import {
  addParentRefs,
  deleteRule,
  duplicateRule,
  setEntryActive,
} from "@app/lib/commands";
import { dat } from "@app/lib/dat";
import type { FilterRule } from "@app/lib/filter";
import { itemIndex } from "@app/lib/items";
import { store } from "@app/store";
import { Badge } from "@app/ui/badge";
import { Collapsible, CollapsibleContent } from "@app/ui/collapsible";
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
import {
  createEffect,
  createResource,
  createSignal,
  For,
  onMount,
} from "solid-js";
import Item from "./item";
import { ItemPicker } from "./item-picker";
import { MinimapIcon } from "./map-icon-picker";

const MIN_PREVIEW_WIDTH = 500; // Adjust this value as needed

export default function Rule(props: { rule: FilterRule }) {
  const [editNameActive, setEditNameActive] = createSignal(false);
  const [active, setActive] = createSignal<boolean>(false);
  const [expanded, setExpanded] = createSignal(false);
  const [hovered, setHovered] = createSignal(false);
  const [previewWidth, setPreviewWidth] = createSignal(0);
  const sortable = createSortable(props.rule.id, props.rule);
  const [state] = useDragDropContext();
  const [icons] = createResource(async () => {
    const url = await dat.getArt("minimap");
    const img = new Image();

    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url || "";
    });

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    return { url, height, width };
  });

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
    if (e.target instanceof HTMLInputElement) {
      props.rule.name = e.target.value;
    }
  }

  function handleDuplicate(_: MouseEvent) {
    if (store.filter) {
      duplicateRule(store.filter, props.rule);
    }
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
    <div
      use:sortable
      class='sortable'
      classList={{
        "opacity-25": sortable.isActiveDraggable,
        "transition-transform": !!state.active.draggable,
      }}
    >
      <Dialog>
        <Collapsible
          onOpenChange={(open) => setExpanded(open)}
          open={expanded()}
        >
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                class={`h-12 w-full flex border ${props.rule.enabled ? "text-primary" : "text-accent"} cursor-pointer items-center justify-between select-none ${getBorderColor(active(), hovered())}`}
                onMouseOut={() => setHovered(false)}
                onMouseOver={() => setHovered(true)}
                onFocus={() => null}
                onBlur={() => null}
                onMouseDown={onMouseDown}
                ref={previewRef}
              >
                <div class='m-1 flex items-center w-full'>
                  <div class='text-xl p-1 flex w-full items-center'>
                    <div class='w-16 flex items-center mr-1'>
                      {props.rule.show ? (
                        <Badge variant='success'>Show</Badge>
                      ) : (
                        <Badge variant='error'>Hide</Badge>
                      )}
                    </div>
                    <input
                      class={`flex pb-1 w-full bg-primary-foreground outline-none border-none ${editNameActive() ? "pointer-events-auto" : "pointer-events-none"}`}
                      type='text'
                      value={props.rule.name}
                      onChange={handleNameChange}
                    />
                  </div>
                </div>
                <div class='flex items-center max-w-min'>
                  <div
                    class='flex text-nowrap p-1 px-4 items-center justify-center border border-1 mr-1'
                    style={{
                      display:
                        previewWidth() >= MIN_PREVIEW_WIDTH ? "flex" : "none",
                      color: `rgba(${props.rule.actions.text?.r ?? 0}, ${props.rule.actions.text?.g ?? 0}, ${props.rule.actions.text?.b ?? 0}, ${(props.rule.actions.text?.a ?? 255) / 255})`,
                      "border-color": `rgba(${props.rule.actions.border?.r ?? 0}, ${props.rule.actions.border?.g ?? 0}, ${props.rule.actions.border?.b ?? 0}, ${(props.rule.actions.border?.a ?? 255) / 255})`,
                      "background-color": `rgba(${props.rule.actions.background?.r ?? 0}, ${props.rule.actions.background?.g ?? 0}, ${props.rule.actions.background?.b ?? 0}, ${(props.rule.actions.background?.a ?? 255) / 255})`,
                    }}
                  >
                    <div class='mr-1'>
                      {props.rule.actions.icon?.enabled ? (
                        <MinimapIcon
                          sheet={icons()?.url}
                          sheetHeight={icons()?.height}
                          scale={3}
                          size={props.rule.actions.icon?.size}
                          shape={props.rule.actions.icon?.shape}
                          color={props.rule.actions.icon?.color}
                        />
                      ) : (
                        ""
                      )}
                    </div>
                    {props.rule.bases.length
                      ? props.rule.bases
                          .filter((base) => base.enabled)
                          .reduce(
                            (a, b) => {
                              return a.name.length <= b.name.length ? a : b;
                            },
                            props.rule.bases.find((base) => base.enabled) ||
                              props.rule.bases[0],
                          ).name
                      : "Item"}
                  </div>
                  <div
                    class={`hover:bg-muted flex items-center h-11 p-1 ${!props.rule.bases.length ? "opacity-30" : ""}`}
                    onMouseDown={(e: MouseEvent) => {
                      e.stopPropagation();
                      if (!props.rule.bases.length) return;
                      if (e.button === 0 && !e.shiftKey) {
                        return setExpanded(!expanded());
                      }
                    }}
                  >
                    {expanded() ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  </div>
                </div>
              </div>
            </ContextMenuTrigger>
            <ContextMenuPortal>
              <ContextMenuContent class='w-48'>
                <DialogTrigger
                  as={ContextMenuItem}
                  onClick={() => setExpanded(true)}
                  disabled={!itemIndex.searchIndex}
                >
                  <div class='flex justify-between items-center w-full'>
                    Edit Bases
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
          <DialogContent class='sm:max-w-[600px] overflow-y-visible'>
            <ItemPicker rule={props.rule} />
          </DialogContent>
        </Collapsible>
      </Dialog>
    </div>
  );
}
