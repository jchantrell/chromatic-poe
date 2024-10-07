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

export function Settings() {
  return (
    <Dialog>
      <DialogTrigger variant='ghost' as={Button<"button">}>
        <SettingsIcon />
      </DialogTrigger>
      <DialogContent class='sm:max-w-[425px]'>
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
