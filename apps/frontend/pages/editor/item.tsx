import { dat } from "@app/lib/dat";
import { itemIndex, setEntryActive, type FilterItem } from "@app/lib/filter";
import { store } from "@app/store";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@app/ui/context-menu";
import type { Setter } from "solid-js";
import { createResource } from "solid-js";

function Name(props: { item: FilterItem }) {
  return (

     <div class='pointer-events-none text-lg'>
        {props.item.name}
        {props.item.category === "Uniques" && (
          <span class='ml-1 text-xs text-neutral-400'> {props.item.base}</span>
        )}
      </div>
  )
}

export function Visual(props: { item: FilterItem; class?: string }) {
  const [art] = createResource(
    () => props.item,
    async (item) => {
      // FilterItem doesn't have 'art', lookup in itemIndex
      const entry = itemIndex.itemTable?.[item.category]?.[item.name];
      const artPath = entry?.art;
      
      if (!artPath) return "/static/tainted-chromatic-icon.png";
      
      const artMap = await dat.getItemArt([{ art: artPath }]);
      return artMap.get(artPath) || "/static/tainted-chromatic-icon.png";
    }
  );

  return (
    !itemIndex.itemTable?.[props.item.category]?.[props.item.name] ? <Name item={props.item} /> :
    <div
      class={`p-1 px-2 ${props.item.enabled ? "text-primary" : "text-accent"} cursor-pointer border items-center flex select-none ${props.class}`}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (e.button === 0 && e.shiftKey && store.filter) {
          setEntryActive(store.filter, props.item, !props.item.enabled);
        }
      }}
    >
      <figure class='max-w-lg'>
        <img
          class='mr-1 h-8 max-w-full pointer-events-none'
          alt={`${props.item.name} icon`}
          src={art() || "/static/tainted-chromatic-icon.png"}
          onError={(e) => (e.currentTarget.src = "/static/tainted-chromatic-icon.png")}
        />
      </figure>
      <Name item={props.item} />
    </div>
  );
}

export default function Item(props: {
  item: FilterItem;
  setHovered: Setter<boolean>;
}) {
  function handleActive() {
    if (store.filter) {
      setEntryActive(store.filter, props.item, !props.item.enabled);
    }
  }

  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger>
          <Visual class='hover:border-accent' item={props.item} />
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class='w-48'>
            <ContextMenuItem onMouseDown={handleActive}>
              <span>{props.item.enabled ? "Disable" : "Enable"}</span>
              <ContextMenuShortcut>⇧+LClick</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    </li>
  );
}
