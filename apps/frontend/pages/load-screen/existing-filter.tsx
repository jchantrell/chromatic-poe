import { createSignal } from "solid-js";
import type { Filter } from "@app/lib/filter";
import { Button } from "@pkgs/ui/button";
import { Dialog, DialogContent } from "@pkgs/ui/dialog";
import { TextField, TextFieldInput } from "@pkgs/ui/text-field";
import { EditIcon, TrashIcon, CopyIcon } from "@pkgs/icons";
import { timeSince } from "@pkgs/lib/utils";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { notify } from "@pkgs/ui/sonner";
import { store, setFilter, removeFilter } from "@app/store";

import { BASE_URL } from "@app/app";

export default function ExistingFilter(props: { filter: Filter }) {
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
    removeFilter(props.filter);
    await props.filter.deleteFile();
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
    await filter.save();
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
          <a href={`${BASE_URL}edit`}>
            <Button
              class='flex text-left justify-between w-full rounded-t-lg p-0'
              onClick={() => setFilter(props.filter)}
              variant='secondary'
            >
              <div class='ml-2'>
                <div class='text-primary'>
                  {name()} - PoE {props.filter.poeVersion}
                </div>
                <div class='text-xs text-muted-foreground'>
                  {timeSinceUpdate()}
                </div>
              </div>
            </Button>
          </a>
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
