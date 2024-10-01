import { For } from "solid-js";
import { Separator } from "@pkgs/ui/separator";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { store } from "@app/store";
import type { ItemHierarchy } from "@app/types";
import Crumbs from "./crumbs";

const MAGIC_NUMBER = 1;

function Entry(props: {
  item: ItemHierarchy;
}) {
  const icon = getIcon(props.item);
  const isCategory = props.item.type !== "item";

  function setActive(entry: ItemHierarchy, state: boolean) {
    entry.enabled = state;
    setChildrenActive(entry.children, state);
    if (entry.parent) {
      setParentActive(entry.parent);
    }
  }

  function setChildrenActive(children: ItemHierarchy[], state: boolean) {
    for (const child of children) {
      child.enabled = state;
      setChildrenActive(child.children, state);
    }
  }

  function setParentActive(parent: ItemHierarchy) {
    if (parent?.children.some((e) => e.enabled)) {
      parent.enabled = true;
    } else {
      parent.enabled = false;
    }
    if (parent.parent) setParentActive(parent.parent);
  }

  function getIcon(item: ItemHierarchy) {
    if (item?.icon) return item.icon;

    const middle = Math.floor((item.children.length - 1) / MAGIC_NUMBER);
    const child = item.children[middle];

    return getIcon(child);
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onMouseDown={(e) => {
              if (isCategory && e.button === 0) {
                store.view = props.item;
                store.crumbs = [
                  ...store.crumbs,
                  { title: props.item.name, view: props.item },
                ];
              }
            }}
            class={`p-1 border ${props.item.enabled ? "text-primary" : "text-secondary"} ${isCategory ? "border-secondary" : "border-secondary"} hover:border-primary h-full items-center flex select-none ${isCategory ? "cursor-pointer" : "cursor-default"}`}
          >
            {icon ? (
              <figure class='max-w-lg'>
                <img
                  class='mr-1 h-8 max-w-full pointer-events-none'
                  alt={`${props.item.name} icon`}
                  src={icon}
                />
              </figure>
            ) : (
              <></>
            )}
            <div class='pointer-events-none text-xl'>{props.item.name}</div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class='w-48'>
            <ContextMenuItem
              onMouseDown={() => setActive(props.item, !props.item.enabled)}
            >
              <span>{props.item.enabled ? "Disable" : "Enable"}</span>
              <ContextMenuShortcut>⇧+LClick</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    </>
  );
}

export function Categories() {
  return (
    <>
      <Crumbs class='ml-3 mt-1' />
      <div
        class='m-2 p-1 flex flex-col h-full gap-2'
        onMouseDown={() => console.log("click")}
      >
        {store?.view?.children[0] && store.view.children[0].type === "item" ? (
          <For each={store.view.children}>
            {(child) => {
              return <Entry item={child} />;
            }}
          </For>
        ) : (
          <For each={store?.view?.children}>
            {(entry, i) => {
              if (store?.view?.type === "root") {
                return (
                  <>
                    <div class='flex h-auto flex-wrap gap-1'>
                      <For each={entry.children}>
                        {(child) => {
                          return <Entry item={child} />;
                        }}
                      </For>
                    </div>
                    {store?.view.children &&
                    i() < store.view.children.length - 1 ? (
                      <Separator />
                    ) : (
                      <></>
                    )}
                  </>
                );
              }
              return <Entry item={entry} />;
            }}
          </For>
        )}
      </div>
    </>
  );
}
