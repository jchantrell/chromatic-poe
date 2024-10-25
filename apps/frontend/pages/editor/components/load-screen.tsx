import { createSignal, For, onMount } from "solid-js";
import { store } from "@app/store";
import { generate, type ItemHierarchy, type Filter } from "@app/lib/filter";
import { Button } from "@pkgs/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@pkgs/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel } from "@pkgs/ui/text-field";
import { EditIcon, TrashIcon, CopyIcon } from "@pkgs/icons";
import { alphabeticalSort, timeSince } from "@pkgs/lib/utils";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { notify } from "@pkgs/ui/sonner";
import { toast } from "solid-sonner";
import { useColorMode } from "@kobalte/core";
import chromatic from "@app/lib/config";

function loadFilter(filter: Filter) {
  store.filter = filter;
  store.activeView = filter.rules;
  store.crumbs = [{ title: "Home", view: store.filter?.rules }];
  getRefs(filter.rules.children, []);
}

function getRefs(items: ItemHierarchy[]) {
  for (const item of items) {
    if (item.type === "category") {
      getRefs(item.children);
    }
    if (item.type === "rule") {
      store.rules[item.id] = item;
      getRefs(item.children);
    }
    if (item.type === "item") {
      store.items[item.id] = item;
    }
  }
}

export function CreateFilter() {
  const [name, setName] = createSignal("Chromatic");
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [version, setVersion] = createSignal(1);

  async function createFilter() {
    if (store.filters.some((e) => e.name === name())) {
      toast(`Filter with name ${name()} already exists.`);
      return;
    }
    const filter = await generate(name(), version());
    await filter.writeFile();
    store.filters.push(filter);
    loadFilter(filter);
    setDialogOpen(false);
    toast(`Created filter named ${name()}.`);
  }

  return (
    <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
      <DialogTrigger
        class='text-center cursor-pointer grid max-w-sm rounded-lg items-cente p-0'
        as={Button<"button">}
      >
        Create New Filter
      </DialogTrigger>
      <DialogContent class='sm:max-w-[400px] p-4 bg-primary-foreground select-none'>
        <DialogHeader>
          <DialogTitle>Create Filter</DialogTitle>
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
          <div class='flex items-center gap-4'>
            <div class='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
              PoE Version
            </div>
            <fieldset class='flex gap-2'>
              <div>
                <input
                  type='radio'
                  id='1'
                  name='version'
                  value='1'
                  checked
                  class='mr-1'
                  onChange={() => setVersion(1)}
                />
                <label for='1'>1</label>
              </div>
              <div>
                <input
                  type='radio'
                  id='2'
                  name='version'
                  value='2'
                  class='mr-1'
                  onChange={() => setVersion(2)}
                  disabled={true}
                />
                <label for='2'>2</label>
              </div>
            </fieldset>
          </div>
          <Button
            class='text-center cursor-pointer grid  max-w-sm rounded-lg items-center border p-0'
            type='submit'
            onClick={createFilter}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExistingFilter(props: { filter: Filter }) {
  const [name, setName] = createSignal<string>(props.filter.name);
  const [updateName, setUpdateName] = createSignal<string>(props.filter.name);
  const [copyName, setCopyName] = createSignal<string>(props.filter.name);
  const [lastUpdated, setLastUpdated] = createSignal<Date>(
    props.filter.lastUpdated,
  );
  const [timeSinceUpdate, setTimeSinceUpdate] = createSignal<string>(
    timeSince(lastUpdated()),
  );
  const [nameDialogOpen, setNameDialogOpen] = createSignal(false);
  const [copyDialogOpen, setCopyDialogOpen] = createSignal(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);

  setInterval(() => setTimeSinceUpdate(timeSince(lastUpdated())), 1000);

  async function deleteFilter() {
    store.filters = store.filters.filter(
      (entry) => entry.name !== props.filter.name,
    );
    await props.filter.deleteFile();
    toast(`Deleted filter ${props.filter.name}`);
  }

  async function copyFilter() {
    if (copyName() === name()) {
      notify(`Filter with name "${copyName()}" already exists.`);
      return;
    }

    const collision = store.filters.find((e) => e.name === copyName());

    if (collision) {
      notify(`Filter with name "${copyName()}" already exists.`);
      return;
    }

    setCopyDialogOpen(false);
    const filter = props.filter.copy();
    filter.updateName(copyName());
    await filter.writeFile();
    store.filters.push(filter);
    store.filters.sort(alphabeticalSort((filter) => filter.name));
  }

  async function updateFilterName() {
    if (updateName() === name()) {
      notify(`Filter with name "${updateName()}" already exists.`);
      return;
    }

    const collision = store.filters.find((e) => e.name === updateName());

    if (collision) {
      notify(`Filter with name "${updateName()}" already exists.`);
      return;
    }

    await props.filter.updateName(updateName());
    setNameDialogOpen(false);
    setName(updateName());
    setLastUpdated(props.filter.lastUpdated);
    store.filters.sort(alphabeticalSort((filter) => filter.name));
  }

  return (
    <li class='bg-muted rounded-lg border flex'>
      <Dialog open={copyDialogOpen()} onOpenChange={setCopyDialogOpen}>
        <DialogContent class='max-w-[400px]flex items-center gap-1 rounded-lg p-1'>
          <TextField
            class='flex items-center gap-4'
            onChange={setCopyName}
            onKeyPress={async (e: KeyboardEvent) => {
              if (e.key === "Enter") {
                await copyFilter();
              }
            }}
          >
            <TextFieldInput
              value={copyName()}
              class='col-span-3 bg-primary-foreground'
              type='text'
            />
          </TextField>
        </DialogContent>
      </Dialog>
      <Dialog open={nameDialogOpen()} onOpenChange={setNameDialogOpen}>
        <DialogContent class='max-w-[400px] p-1 bg-primary-foreground rounded-lg select-none'>
          <TextField
            class='flex items-center gap-4'
            onChange={setUpdateName}
            onKeyPress={async (e: KeyboardEvent) => {
              if (e.key === "Enter") {
                await updateFilterName();
              }
            }}
          >
            <TextFieldInput
              value={updateName()}
              class='col-span-3 bg-primary-foreground'
              type='text'
            />
          </TextField>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
        <DialogContent class='max-w-[400px] p-1 bg-primary-foreground rounded-lg select-none flex flex-col items-center'>
          <div class='grid gap-4 py-4'>
            <div>You sure you want to delete {name()}?</div>
            <Button onClick={deleteFilter} variant='destructive'>
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ContextMenu>
        <ContextMenuTrigger class='w-full'>
          <Button
            class='flex text-left justify-between w-full rounded-t-lg p-0'
            onClick={() => loadFilter(props.filter)}
            variant='secondary'
          >
            <div class='ml-2'>
              <div class='text-primary'>{name()}</div>
              <div class='text-xs text-muted-foreground'>
                {timeSinceUpdate()}
              </div>
            </div>
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => setNameDialogOpen(true)}>
            <div class='flex items-center text-xs'>
              <EditIcon />
              <div class='ml-1'>Change Name</div>
            </div>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setCopyDialogOpen(true)}>
            <div class='flex items-center text-xs'>
              <CopyIcon />
              <div class='ml-1'>Copy</div>
            </div>
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => setDeleteDialogOpen(true)}
            class='data-[highlighted]:bg-destructive'
          >
            <div class='flex items-center text-xs'>
              <TrashIcon />
              <div class='ml-1'>Delete</div>
            </div>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );
}
export function LoadScreenMenu() {
  const { colorMode } = useColorMode();

  onMount(async () => {
    if (chromatic.runtime === "web") {
      const filter = await generate("test", 1);
      filter.setLastUpdated(new Date());
      await filter.writeFile();
      loadFilter(filter);
    }
  });

  return (
    <div
      class={`size-full flex items-center justify-center relative bg-cover ${colorMode() === "dark" ? "bg-[url('/backgrounds/bg-dark.jpg')]" : "bg-[url('/images/editor-bg-light.jpg')]"}`}
    >
      <div class='bg-neutral-900/70 border-neutral-900/70 text-foreground w-full max-w-sm rounded-lg border p-4 grid gap-2 items-center z-0'>
        <CreateFilter />
        <ul class='max-w-sm rounded-lg grid gap-2 items-center'>
          <For each={store.filters}>
            {(filter) => <ExistingFilter filter={filter} />}
          </For>
        </ul>
      </div>
    </div>
  );
}
