import { SettingsIcon } from "@pkgs/icons";
import { Button } from "@pkgs/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@pkgs/ui/dialog";
import { TextField, TextFieldLabel } from "@pkgs/ui/text-field";
import Theme from "./theme";
import { Separator } from "@pkgs/ui/separator";
import { ChooseDirectory } from "./choose-dir";

export function Settings() {
  return (
    <Dialog>
      <DialogTrigger variant='ghost' as={Button<"button">}>
        <SettingsIcon />
      </DialogTrigger>
      <DialogContent class='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>General</DialogTitle>
        </DialogHeader>
        <div class='grid gap-4 py-2'>
          <TextField class='grid grid-cols-4 items-center gap-4'>
            <TextFieldLabel class='text-right'>PoE Directory</TextFieldLabel>
            <ChooseDirectory class='col-span-3' />
          </TextField>
          <TextField class='grid grid-cols-4 items-center gap-4'>
            <TextFieldLabel class='text-right'>Autosave</TextFieldLabel>
            <ChooseDirectory class='col-span-3' />
          </TextField>
        </div>
        <Separator />
        <DialogHeader>
          <DialogTitle>Display</DialogTitle>
        </DialogHeader>
        <div class='grid gap-4 py-4'>
          <TextField class='grid grid-cols-4 items-center gap-4'>
            <TextFieldLabel class='text-right'>Theme</TextFieldLabel>
            <Theme />
          </TextField>
        </div>
      </DialogContent>
    </Dialog>
  );
}
