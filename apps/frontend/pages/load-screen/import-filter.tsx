import { createSignal } from "solid-js";
import { generateFilter } from "@app/lib/filter";
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
import chromatic from "@app/lib/config";

export default function ImportFilter() {
  const [name, setName] = createSignal("Chromatic");
  const [raw, setRaw] = createSignal("");
  const [dialogOpen, setDialogOpen] = createSignal(false);
  const [version, setVersion] = createSignal(2);

  async function createFilter() {
    if (raw() === "") {
      toast("Please upload a filter file.");
      return;
    }
    if (name() === "") {
      toast("Please enter a name for the filter.");
      return;
    }
    if (store.filters.some((e) => e.name === name())) {
      toast(`Filter with name ${name()} already exists.`);
      return;
    }
    const filter = await generateFilter(name(), version(), raw());
    await filter.save();
    setDialogOpen(false);
  }

  async function handleUpload(e: Event) {
    if (e.target instanceof HTMLInputElement) {
      if (!e.target.files?.[0]) {
        toast.error("Please upload a filter file.");
        return;
      }
      const file = e.target.files[0];
      const filter = await file.text();
      if (!filter) {
        toast.error("Could not parse uploaded file.");
        return;
      }
      if (filter) {
        setName(file.name.split(".")[0]);
        setRaw(filter);
      }
    }
  }

  function handleVersion(version: number) {
    toast("Only PoE 2 is supported at the moment.");
  }

  return (
    <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
      <DialogTrigger
        class='text-center cursor-pointer grid max-w-sm rounded-lg p-0'
        as={Button<"button">}
      >
        Import
      </DialogTrigger>
      <DialogContent class='sm:max-w-[400px] p-4 bg-primary-foreground select-none'>
        <DialogHeader>
          <DialogTitle>Import Filter</DialogTitle>
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
              onChange={(checked) => {
                handleVersion(checked ? 2 : 1);
              }}
            >
              <SwitchControl class='bg-neutral-300 data-[checked]:bg-neutral-300'>
                <SwitchThumb />
              </SwitchControl>
            </Switch>
            <div class='text-md font-semibold'>2</div>
          </div>

          <div class='flex items-center w-full'>
            {chromatic.runtime === "web" && (
              <input
                type='file'
                id='file'
                class='hidden'
                accept='.filter'
                onChange={handleUpload}
              />
            )}
            <div class='flex w-full'>
              <label
                for='file'
                class='inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 text-neutral-700-foreground bg-neutral-700 hover:bg-neutral-700/90 w-20'
              >
                Upload
              </label>
              <div class='ml-2 flex justify-center items-center text-muted-foreground'>
                {raw() === ""
                  ? "No filter uploaded"
                  : "Filter seems valid. You can import now."}
              </div>
            </div>
          </div>
          <Button onClick={createFilter}>Import</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
