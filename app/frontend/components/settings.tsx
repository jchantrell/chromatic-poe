import { SettingsIcon } from "@app/icons";
import chromatic from "@app/lib/config";
import { checkForUpdate, relaunchApp } from "@app/lib/update";
import { to } from "@app/lib/utils";
import { store } from "@app/store";
import { Button } from "@app/ui/button";
import { Checkbox } from "@app/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@app/ui/dialog";
import { Label } from "@app/ui/label";
import { Separator } from "@app/ui/separator";
import { TextField, TextFieldLabel } from "@app/ui/text-field";
import { createSignal, onMount } from "solid-js";
import { toast } from "solid-sonner";
import Theme from "./theme";

export function Settings() {
  const [version, setVersion] = createSignal("0.0.0");

  async function handleUpdate() {
    const [err] = await to(checkForUpdate());
    if (err) {
      toast.error("Failed to check for updates.", {
        description: err as unknown as string,
      });
    }
  }

  onMount(async () => {
    setVersion(await chromatic.getVersion());
  });

  return (
    <Dialog>
      <DialogTrigger variant='ghost' as={Button<"button">}>
        <SettingsIcon />
      </DialogTrigger>
      <DialogContent class='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>General</DialogTitle>
        </DialogHeader>
        <div class='grid py-2'>
          <TextField class='grid grid-cols-4 items-center gap-4'>
            <Label aria-disabled={true} class='text-right'>
              Autosave
            </Label>
            <Checkbox disabled checked={true} />
          </TextField>
        </div>
        <Separator />
        <DialogHeader>
          <DialogTitle>Display</DialogTitle>
        </DialogHeader>
        <div class='grid py-4'>
          <TextField class='grid grid-cols-4 items-center gap-4'>
            <TextFieldLabel class='text-right'>Theme</TextFieldLabel>
            <Theme />
          </TextField>
        </div>
        <Separator />
        <div class='py-4 flex items-center justify-center'>
          <div class='flex items-center gap-1 pb-1'>
            <Label>Current Version</Label>
            {version()}
          </div>
          {chromatic.runtime === "desktop" ? (
            <div class='flex items-center justify-center'>
              {!store.appNeedsRestart ? (
                <Button variant='secondary' onClick={handleUpdate}>
                  Check for Updates
                </Button>
              ) : (
                <Button variant='secondary' onClick={relaunchApp}>
                  Restart Now
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
