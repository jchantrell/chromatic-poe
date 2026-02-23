import Tooltip from "@app/components/tooltip";
import { ChevronDownIcon, ChevronUpIcon } from "@app/icons";
import {
  addParentRefs,
  deleteRule,
  duplicateRule,
  refreshUniqueCollectionBases,
  setEntryActive,
} from "@app/lib/commands";
import chromatic from "@app/lib/config";
import type { FilterRule, UniqueCollectionRule } from "@app/lib/filter";
import { itemIndex } from "@app/lib/items";
import { fetchMissingUniques } from "@app/lib/poeladder";
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
import { createEffect, createSignal, Show } from "solid-js";
import { toast } from "solid-sonner";
import { DropPreview } from "./drop-preview";
import { ItemPicker } from "./item-picker";

export default function Rule(props: {
  rule: FilterRule;
  expanded: boolean;
  setExpanded: (id: string, expanded: boolean) => void;
}) {
  const [selected, setSelected] = createSignal<boolean>(false);
  const [hovered, setHovered] = createSignal(false);
  const [refreshing, setRefreshing] = createSignal(false);

  const isUniqueCollection = () => props.rule.type === "unique-collection";

  let previewRef: HTMLDivElement | undefined;

  function setRuleActive(e: MouseEvent) {
    e.stopPropagation();
    if (e.button === 0 && !e.shiftKey) {
      store.activeRule = props.rule;
    }
    if (e.button === 0 && e.shiftKey) {
      handleActive();
    }
  }

  function setExpanded(e: MouseEvent) {
    e.stopPropagation();
    if (!props.rule.bases.length) return;
    if (e.button === 0 && !e.shiftKey) {
      props.setExpanded(props.rule.id, !props.expanded);
    }
  }

  function getBorderColor() {
    if (!props.rule.enabled) {
      return "";
    }
    if (selected()) {
      return "border-1 border-ring/30";
    }
    if (hovered()) {
      return "border-1 border-accent";
    }

    return "border border-accent";
  }

  function getTextColor() {
    if (!props.rule.enabled) {
      return "text-muted-foreground/20";
    }
    if (selected()) {
      return "text-foreground";
    }
    if (hovered()) {
      return "text-foreground";
    }
    return "text-foreground/80";
  }

  function getSelectedStyles() {
    if (!props.rule.enabled) return "";
    if (selected()) {
      return "bg-accent/40";
    }
    return "";
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

  async function handleRefreshUniques(e: MouseEvent) {
    e.stopPropagation();
    if (!store.filter || props.rule.type !== "unique-collection") return;

    const username = chromatic.config?.poeladderUsername;
    if (!username) {
      toast.error("PoE Ladder username not set", {
        description: "Set your PoE Ladder username in settings.",
      });
      return;
    }

    const rule = props.rule as UniqueCollectionRule;
    const league = rule.uniqueCollection.league;
    if (!league) {
      toast.error("No league selected", {
        description: "Open the rule editor and select a league first.",
      });
      return;
    }

    setRefreshing(true);
    const uniques = await fetchMissingUniques(
      username,
      league,
      rule.uniqueCollection.display,
    );
    if (uniques.length > 0) {
      refreshUniqueCollectionBases(store.filter, rule, uniques);
      toast.success(
        `Updated with ${uniques.length} missing unique${uniques.length === 1 ? "" : "s"}`,
      );
    } else {
      toast.info("No missing uniques found for this league");
    }
    setRefreshing(false);
  }

  createEffect(() => {
    if (store.activeRule) {
      setSelected(store.activeRule.id === props.rule.id);
    } else setSelected(false);
  });

  createEffect(() => {
    addParentRefs([props.rule]);
  });

  return (
    <Dialog>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            class={`grid grid-cols-[minmax(200px,_1fr)_auto] items-center justify-between text-accent-foreground select-none bg-secondary transition-[background-color,box-shadow] duration-150 ${getTextColor()} ${getBorderColor()} ${getSelectedStyles()} @container`}
            onMouseOut={() => setHovered(false)}
            onMouseOver={() => setHovered(true)}
            onFocus={() => null}
            onBlur={() => null}
            ref={previewRef}
          >
            <div
              class='m-1 flex items-center min-w-0 text-xl cursor-pointer'
              onMouseUp={setRuleActive}
            >
              <div class='text-xl p-1 flex w-full min-w-0 items-center'>
                <div
                  class={`flex items-center gap-1 mr-1 ${props.rule.enabled ? "" : "grayscale"}`}
                >
                  <div class='w-16 flex items-center'>
                    {props.rule.show ? (
                      <Badge variant='success'>Show</Badge>
                    ) : (
                      <Badge variant='error'>Hide</Badge>
                    )}
                  </div>
                  <Show when={isUniqueCollection()}>
                    <Badge variant='default'>Collection</Badge>
                  </Show>
                </div>
                <input
                  id={`${props.rule.id}-menu`}
                  class='bg-transparent py-1 px-2 border-none min-w-0 field-sizing-content max-w-full'
                  type='text'
                  spellcheck={false}
                  value={props.rule.name}
                  onChange={handleNameChange}
                  onMouseUp={(evt) => evt.stopPropagation()}
                />
              </div>
            </div>
            <div
              class='flex items-center max-w-min cursor-pointer'
              onMouseUp={setRuleActive}
            >
              <div
                class={`hidden @sm:flex text-nowrap items-center justify-center border mr-1 ${props.rule.enabled ? "" : "grayscale"}`}
              >
                <DropPreview rule={props.rule} showIcon iconScale={3} />
              </div>
              <Show when={isUniqueCollection()}>
                <Tooltip text='Refresh missing uniques'>
                  <button
                    type='button'
                    class='flex items-center h-8 w-8 p-1 justify-center hover:text-accent-foreground/60 cursor-pointer'
                    onMouseDown={handleRefreshUniques}
                    onMouseUp={(e) => e.stopPropagation()}
                    disabled={refreshing()}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      stroke-width='2'
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      class={refreshing() ? "animate-spin" : ""}
                    >
                      <path d='M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' />
                      <path d='M3 3v5h5' />
                      <path d='M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16' />
                      <path d='M16 16h5v5' />
                    </svg>
                  </button>
                </Tooltip>
              </Show>
              <div
                class={`flex items-center h-11 p-1 ${!props.rule.bases.length ? "opacity-0" : "hover:text-accent-foreground/60"}`}
                onMouseDown={setExpanded}
                onMouseUp={(e) => e.stopPropagation()}
              >
                {props.expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
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
  );
}
