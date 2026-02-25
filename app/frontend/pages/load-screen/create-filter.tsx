import { generateFilter } from "@app/lib/filter";
import { store } from "@app/store";
import { Button } from "@app/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@app/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel } from "@app/ui/text-field";
import { ToggleGroup, ToggleGroupItem } from "@app/ui/toggle-group";
import { createSignal } from "solid-js";
import { toast } from "solid-sonner";

export default function CreateFilter() {
  const [name, setName] = createSignal("Chromatic");
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [version, setVersion] = createSignal<1 | 2>(2);

  async function createFilter() {
    if (name() === "") {
      toast("Please enter a name for the filter.");
      return;
    }
    if (store.filters.some((e) => e.name === name())) {
      toast(`Filter with name ${name()} already exists.`);
      return;
    }
    const filter = await generateFilter(name(), version());
    store.filters.push(filter);
    await filter.save();
    setDialogOpen(false);
  }

  return (
    <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
      <DialogTrigger
        class='text-center cursor-pointer grid max-w-sm rounded-lg p-0'
        as={Button<"button">}
      >
        Create New
      </DialogTrigger>
      <DialogContent
        class='sm:max-w-[400px] p-4 bg-primary-foreground select-none'
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter") {
            createFilter();
          }
        }}
      >
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
          <div class='flex items-center gap-2'>
            <div class='text-sm font-medium leading-none mr-2'>PoE Version</div>
            <ToggleGroup
              value={String(version())}
              onChange={(v) => {
                if (v) setVersion(Number(v) as 1 | 2);
              }}
            >
              <ToggleGroupItem
                value='1'
                class='px-3 data-pressed:bg-neutral-700 bg-neutral-700/25 border border-accent'
              >
                PoE 1
              </ToggleGroupItem>
              <ToggleGroupItem
                value='2'
                class='px-3 data-pressed:bg-neutral-700 bg-neutral-700/25 border border-accent'
              >
                PoE 2
              </ToggleGroupItem>
            </ToggleGroup>
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
