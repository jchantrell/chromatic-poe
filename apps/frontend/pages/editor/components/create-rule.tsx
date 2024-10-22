import { createSignal } from "solid-js";
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
import { toast } from "solid-sonner";
import type { FilterRule } from "@app/lib/filter";

function CreateRule() {
  const [name, setName] = createSignal("");
  const [dialogOpen, setDialogOpen] = createSignal(false);

  async function createRule() {
    if (name() === "") {
      return toast("Enter a name for the rule.");
    }
    if (store.view?.children.some((e) => e.name === name())) {
      return toast(`Rule with name ${name()} already exists.`);
    }

    if (!store.view || store.view.type !== "category") {
      return toast(
        "Current filter view is not a category, cannot create rule.",
      );
    }

    if (store.view && store.view.type === "category") {
      const rule: FilterRule = {
        name: name(),
        enabled: true,
        parent: store.view,
        type: "rule",
        children: [],
        conditions: [],
        actions: [],
      };
      store.view.children.push(rule);
    }

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

export default CreateRule;
