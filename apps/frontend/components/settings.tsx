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
import { Checkbox } from "@pkgs/ui/checkbox";
import { Label } from "@pkgs/ui/label";
import chromatic from "@app/lib/config";
import { createSignal, onMount } from "solid-js";
import { relaunchApp, checkForUpdate } from "@app/lib/update";
import { to } from "@pkgs/lib/utils";
import { toast } from "solid-sonner";
import { store } from "@app/store";

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
          {chromatic.fileSystem.runtime === "desktop" && (
            <TextField class='grid grid-cols-4 items-center gap-4'>
              <TextFieldLabel class='text-right'>PoE Directory</TextFieldLabel>
              <ChooseDirectory class='col-span-3' />
            </TextField>
          )}
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
        <div class='grid py-4 flex items-center justify-center'>
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
