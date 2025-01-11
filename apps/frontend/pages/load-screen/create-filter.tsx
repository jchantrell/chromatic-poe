import { createSignal, For } from "solid-js";
import { generateFilter, Template } from "@app/lib/filter";
import { Button } from "@pkgs/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@pkgs/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel } from "@pkgs/ui/text-field";
import { toast } from "solid-sonner";
import { store } from "@app/store";
import { Switch, SwitchControl, SwitchThumb } from "@pkgs/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@pkgs/ui/toggle-group";

export default function CreateFilter() {
  const [name, setName] = createSignal("Chromatic");
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [template, setTemplate] = createSignal<Template>(Template.BLANK);
  const [version, setVersion] = createSignal(2);

  async function createFilter() {
    if (name() === "") {
      toast("Please enter a name for the filter.");
      return;
    }
    if (store.filters.some((e) => e.name === name())) {
      toast(`Filter with name ${name()} already exists.`);
      return;
    }
    const filter = await generateFilter(name(), version(), template());
    await filter.save();
    setDialogOpen(false);
  }

  function handleTemplate(template: Template) {
    setTemplate(template);
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
            <div class='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2'>
              PoE Version
            </div>
            <div class='text-md font-semibold'>1</div>
            <Switch
              checked={version() === 2}
              onChange={(version) => {
                toast("Only PoE 2 is supported at the moment.");
              }}
            >
              <SwitchControl class='bg-neutral-300 data-[checked]:bg-neutral-300'>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
            <div class='text-md font-semibold'>2</div>
          </div>
          <div class='flex items-center gap-2'>
            <div class='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2'>
              Template
            </div>
            <ToggleGroup
              onChange={(v) => handleTemplate(v as Template)}
              value={template()}
              class='flex flex-wrap'
            >
              <For each={Object.values(Template)}>
                {(option) => {
                  return (
                    <ToggleGroupItem
                      class='data-[pressed]:bg-neutral-700 bg-neutral-700/20 border border-accent'
                      value={option}
                    >
                      {option}
                    </ToggleGroupItem>
                  );
                }}
              </For>
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
