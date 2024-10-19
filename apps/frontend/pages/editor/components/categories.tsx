import { createSignal, For, onMount } from "solid-js";
import { Separator } from "@pkgs/ui/separator";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { Collapsible, CollapsibleContent } from "@pkgs/ui/collapsible";
import { Button } from "@pkgs/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@pkgs/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel } from "@pkgs/ui/text-field";
import { store } from "@app/store";
import type { ItemHierarchy } from "@app/services/filter";
import Crumbs from "./crumbs";
import { input } from "@app/services/input";
import { ChevronDownIcon } from "@pkgs/icons";
import { toast } from "solid-sonner";

function setActive(entry: ItemHierarchy, state: boolean) {
  entry.enabled = state;
  setChildrenActive(entry.children, state);
  if (entry.parent) {
    setParentActive(entry.parent);
  }

  store.filter?.writeFile();
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
  if (!item.children.length) return null;

  const middle = Math.floor(item.children.length / 2);
  const child = item.children[middle];

  return getIcon(child);
}

function Item(props: {
  item: ItemHierarchy;
}) {
  const icon = getIcon(props.item);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            onMouseDown={(e) => {
              if (e.button === 0 && e.shiftKey) {
                setActive(props.item, !props.item.enabled);
              }
            }}
            class={`p-1 px-2 ${props.item.enabled ? "text-primary" : "text-accent"} border border-primary-foreground hover:border-accent items-center flex select-none`}
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
            <div class='pointer-events-none text-lg'>{props.item.name}</div>
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

function Category(props: {
  item: ItemHierarchy;
  topLevel?: boolean;
}) {
  const [expanded, setExpanded] = createSignal(false);
  const icon = getIcon(props.item);

  return (
    <>
      <Collapsible
        class='grid'
        onOpenChange={(open) => setExpanded(open)}
        open={expanded()}
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              class={`p-1 border ${props.item.enabled ? "text-primary" : "text-accent"} cursor-pointer hover:border-primary h-full items-center flex justify-between select-none ${expanded() && props.item.enabled ? "border-primary" : ""} ${expanded() && !props.item.enabled ? "border-accent" : ""}`}
              onMouseDown={(e: MouseEvent) => {
                // expand if children are items
                if (
                  e.button === 0 &&
                  !e.shiftKey &&
                  (props.item.children?.[0]?.type === "item" ||
                    !props.item.children.length)
                ) {
                  return setExpanded(!expanded());
                }
                // traverse down if children are categories
                if (e.button === 0 && !e.shiftKey) {
                  store.view = props.item;
                  store.crumbs = [
                    ...store.crumbs,
                    { title: props.item.name, view: props.item },
                  ];
                }

                // disable category and all descendants if modifier held
                if (e.button === 0 && e.shiftKey) {
                  setActive(props.item, !props.item.enabled);
                }
              }}
            >
              <div class='flex items-center justify-center min-w-max'>
                {icon ? (
                  <figure class='max-w-lg shrink-0'>
                    <img
                      class='mr-1 h-8 max-w-full pointer-events-none'
                      alt={`${props.item.name} icon`}
                      src={icon}
                    />
                  </figure>
                ) : (
                  <></>
                )}
                <div class='pointer-events-none text-xl p-1'>
                  {props.item.name}
                </div>
              </div>
              <div class='ml-1'>
                {props.topLevel ? <></> : <ChevronDownIcon />}
              </div>
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
        <CollapsibleContent>
          {props.item.children[0].type === "item" && !props.topLevel ? (
            <ul
              class={`ms-6 border-s-[1px] ps-1 ${props.item.enabled ? "border-primary" : "border-accent"} flex flex-wrap gap-1 p-1`}
            >
              <For each={props.item.children}>
                {(child) => {
                  return (
                    <li class='flex'>
                      <Item item={child} />
                    </li>
                  );
                }}
              </For>
            </ul>
          ) : (
            <></>
          )}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}

function CreateRule() {
  const [name, setName] = createSignal("");
  const [dialogOpen, setDialogOpen] = createSignal(false);

  async function createRule() {
    if (name() === "") {
      toast("Enter a name for the rule.");
      return;
    }
    if (store.view?.children.some((e) => e.name === name())) {
      toast(`Rule with name ${name()} already exists.`);
      return;
    }

    store.view?.children.push({
      name: name(),
      enabled: true,
      parent: store.view,
      type: "rule",
      children: [],
    });

    setDialogOpen(false);
  }

  return (
    <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
      <DialogTrigger
        class={
          "p-2 pl-3 border text-xl text-primary border-accent hover:border-primary select-none"
        }
      >
        Create New Rule
      </DialogTrigger>
      <DialogContent class='sm:max-w-[400px] p-4 bg-primary-foreground select-none'>
        <DialogHeader>
          <DialogTitle>New Rule</DialogTitle>
        </DialogHeader>
        <div class='grid gap-4 py-4'>
          <TextField class='flex items-center gap-4' onChange={setName}>
            <TextFieldLabel>Name</TextFieldLabel>
            <TextFieldInput
              value={name()}
              class='col-span-3 bg-primary-foreground'
              type='text'
            />
          </TextField>
          <Button
            class='text-center cursor-pointer grid  max-w-sm rounded-lg items-center border p-0'
            type='submit'
            onClick={createRule}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Categories() {
  onMount(() => {
    input.on("keypress", (key: string) => {
      if (key === "Backspace" && store.filter && store.crumbs.length > 1) {
        store.view = store.crumbs[store.crumbs.length - 2].view;
        store.crumbs.pop();
      }
    });
  });

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <Crumbs />
          <div class='m-2 p-1 flex flex-col h-full gap-2'>
            <For each={store?.view?.children}>
              {(entry, i) => {
                if (store?.view?.type === "root") {
                  return (
                    <>
                      <div class='flex h-auto flex-wrap gap-1'>
                        <For each={entry.children}>
                          {(child) => {
                            return <Category item={child} topLevel />;
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
                return <Category item={entry} />;
              }}
            </For>
            {store.view?.type &&
            !["root", "rule"].includes(store.view?.type) ? (
              <CreateRule />
            ) : (
              <></>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent class='w-48'>
            <ContextMenuItem>
              <span>New Rule</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>
    </>
  );
}
