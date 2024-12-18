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
import { toast } from "solid-sonner";
import { createRule, type FilterRule } from "@app/lib/filter";
import { ulid } from "ulid";
import { store } from "@app/store";
import { clone } from "@pkgs/lib/utils";

function CreateRule(props: { parent?: FilterRule }) {
  const [name, setName] = createSignal("");
  const [dialogOpen, setDialogOpen] = createSignal(false);

  async function handleCreate() {
    if (!store.filter) {
      return;
    }
    if (name() === "") {
      return toast("Enter a name for the rule.");
    }
    if (
      props.parent.children.some((e) => e.name === name() && e.type === "rule")
    ) {
      return toast(`Rule with name ${name()} already exists.`);
    }

    const rule: FilterRule = {
      id: ulid(),
      name: name(),
      icon: null,
      enabled: true,
      parent: props.parent,
      type: "rule",
      children: [],
      conditions: [],
      actions: props.parent
        ? clone(props.parent.actions)
        : {
            text: { r: 255, g: 255, b: 255, a: 1 },
            border: { r: 255, g: 255, b: 255, a: 1 },
            background: { r: 19, g: 14, b: 6, a: 1 },
          },
    };
    createRule(store.filter, rule, props.parent);
    setDialogOpen(false);
    setName("");
  }

  return (
    <Dialog open={dialogOpen()} onOpenChange={setDialogOpen}>
      <DialogTrigger
        class={
          "p-1 pl-3 border w-full text-primary bg-secondary border-accent hover:border-primary select-none"
        }
      >
        New Rule
      </DialogTrigger>
      <DialogContent
        class='sm:max-w-[400px] p-4 bg-primary-foreground select-none'
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter") {
            handleCreate();
          }
        }}
      >
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
            onClick={handleCreate}
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateRule;
