import { moveRule } from "@app/lib/commands";
import type { FilterItem, FilterRule } from "@app/lib/filter";
import { store } from "@app/store";
import { TextField, TextFieldInput } from "@app/ui/text-field";
import {
  createVirtualizer,
  defaultRangeExtractor,
} from "@tanstack/solid-virtual";
import {
  closestCenter,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  type DragEvent,
  DragOverlay,
  SortableProvider,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";
import Fuse from "fuse.js";
import { createMemo, createSignal } from "solid-js";
import CreateRule from "./create-rule";
import Item from "./item";
import Rule from "./rule-menu-entry";

const options = {
  keys: ["name", "bases.name", "bases.base"],
  useExtendedSearch: true,
  ignoreFieldNorm: true,
  minMatchCharLength: 2,
  distance: 160,
  threshold: 0.6,
};

function SortableRule(props: {
  rule: FilterRule;
  expanded: boolean;
  setExpanded: (id: string, expanded: boolean) => void;
}) {
  const sortable = createSortable(props.rule.id, props.rule);
  const [state] = useDragDropContext();

  return (
    <div
      use:sortable
      class='sortable'
      classList={{
        "opacity-25": sortable.isActiveDraggable,
        "transition-transform": !!state.active.draggable,
      }}
    >
      <Rule {...props} />
    </div>
  );
}

export default function Rules() {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [expandedRules, setExpandedRules] = createSignal<string[]>([]);
  let scrollContainerRef: HTMLDivElement | undefined;

  const searchIndex = createMemo(() => {
    return new Fuse(store.filter?.rules || [], options);
  });

  const filteredItems = createMemo(() => {
    const items: Array<{
      item: FilterRule | FilterItem;
      key: string;
      ruleId: string;
    }> = [];

    const term = searchTerm();
    let rules: FilterRule[] = [];

    if (!term) {
      rules = store.filter?.rules || [];
    } else {
      rules = searchIndex()
        .search(`'${term}`)
        .map((result) => result.item);
    }

    for (const rule of rules) {
      items.push({
        item: rule,
        key: getItemKey(rule),
        ruleId: rule.id,
      });

      if (expandedRules().includes(rule.id)) {
        for (const base of rule.bases) {
          items.push({
            item: base,
            key: getItemKey(base, rule.id),
            ruleId: rule.id,
          });
        }
      }
    }

    return items;
  });

  const stickyIndexes = createMemo(() => {
    return filteredItems()
      .map((item, index) => ("actions" in item.item ? index : null))
      .filter((val): val is number => val !== null);
  });

  const [activeStickyIndex, setActiveStickyIndex] = createSignal(0);

  const virtualizer = createVirtualizer({
    get count() {
      return filteredItems().length;
    },
    getScrollElement: () => scrollContainerRef || null,
    getItemKey: (idx: number) => filteredItems()[idx].key,
    estimateSize: (idx: number) => {
      const entry = filteredItems()[idx];
      return "actions" in entry.item ? 50 : 40;
    },
    overscan: 10,
    rangeExtractor: (range) => {
      const active =
        [...stickyIndexes()]
          .reverse()
          .find((index) => range.startIndex >= index) ?? 0;

      setActiveStickyIndex(active);

      const next = new Set([active, ...defaultRangeExtractor(range)]);

      return [...next].sort((a, b) => a - b);
    },
  });

  function getItemKey(
    item: FilterRule | FilterItem,
    parentRuleId?: string,
  ): string {
    return "actions" in item
      ? `rule-${item.id}`
      : `item-${parentRuleId}-${item.name}`;
  }

  function setExpanded(id: string, enabled: boolean) {
    if (!enabled) {
      setExpandedRules(expandedRules().filter((entry) => entry !== id));
      virtualizer.scrollToIndex(
        filteredItems().findIndex((entry) => {
          return "actions" in entry.item && entry.item.id === id;
        }),
      );
    } else {
      setExpandedRules([...expandedRules(), id]);
    }
  }

  function onDragEnd({ draggable, droppable }: DragEvent) {
    if (draggable && droppable && store.filter) {
      moveRule(store.filter, String(draggable.id), String(droppable.id));
    }
  }

  return (
    <DragDropProvider onDragEnd={onDragEnd} collisionDetector={closestCenter}>
      <DragDropSensors />
      <div class='flex flex-col gap-1 h-full m-1 pb-2'>
        <SortableProvider
          ids={store.filter?.rules.map((rule) => rule.id) ?? []}
        >
          <div class='outline-none'>
            <TextField value={searchTerm()} onChange={setSearchTerm}>
              <TextFieldInput type='text' placeholder={"Search for rules..."} />
            </TextField>
          </div>
          <div
            ref={scrollContainerRef}
            class='overflow-y-auto overflow-x-hidden'
          >
            <ul
              class='flex flex-col relative w-full h-full'
              style={{
                height: `${virtualizer.getTotalSize() + 4}px`,
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = filteredItems()[virtualItem.index];
                const expanded = expandedRules().includes(item.ruleId);
                const sticky =
                  activeStickyIndex() === virtualItem.index && expanded;

                return (
                  <div
                    data-key={item.key}
                    class='pr-1'
                    style={{
                      position: sticky ? "sticky" : "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualItem.size}px`,
                      transform: sticky
                        ? ""
                        : `translateY(${virtualItem.start}px)`,
                      "z-index": sticky ? 1 : 0,
                    }}
                  >
                    {"actions" in item.item ? (
                      <SortableRule
                        rule={item.item}
                        expanded={expanded}
                        setExpanded={setExpanded}
                      />
                    ) : (
                      <Item item={item.item} setHovered={() => null} />
                    )}
                  </div>
                );
              })}
            </ul>
          </div>
        </SortableProvider>
        <CreateRule />
      </div>
      <DragOverlay>
        {(draggable) => {
          if (!draggable) return null;
          return (
            <div class='sortable cursor-grab'>
              <Rule
                rule={draggable.data as FilterRule}
                expanded={false}
                setExpanded={setExpanded}
              />
            </div>
          );
        }}
      </DragOverlay>
    </DragDropProvider>
  );
}
