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

import { openUrl } from "@tauri-apps/plugin-opener";
import { createSignal, onMount } from "solid-js";
import { toast } from "solid-sonner";
import Theme from "./theme";

const GITHUB_ISSUE_URL = "https://github.com/jchantrell/chromatic-poe/issues";

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

  async function openGitHubIssues() {
    if (chromatic.runtime === "desktop") {
      await openUrl(GITHUB_ISSUE_URL);
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
      <DialogContent class='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {/* General Section */}
        <section class='space-y-3'>
          <h3 class='text-sm font-medium text-muted-foreground'>General</h3>
          <div class='flex items-center justify-between py-1'>
            <Label class='text-sm text-foreground'>Autosave</Label>
            <Checkbox disabled checked={false} />
          </div>
        </section>

        <Separator class='bg-border/50' />

        {/* Display Section */}
        <section class='space-y-3'>
          <h3 class='text-sm font-medium text-muted-foreground'>Display</h3>
          <div class='flex items-center justify-between py-1'>
            <Label class='text-sm text-foreground'>Theme</Label>
            <Theme />
          </div>
        </section>

        <Separator class='bg-border/50' />

        {/* Versions Section */}
        <section class='space-y-3'>
          <h3 class='text-sm font-medium text-muted-foreground'>Versions</h3>
          <div class='space-y-1'>
            <div class='flex items-center justify-between text-sm'>
              <span class='text-foreground'>Chromatic</span>
              <span class='text-muted-foreground font-mono text-xs'>
                {version()}
              </span>
            </div>
            <div class='flex items-center justify-between text-sm'>
              <span class='text-foreground'>Path of Exile 1</span>
              <span class='text-muted-foreground font-mono text-xs'>
                {store.poeCurrentVersions?.poe1}
              </span>
            </div>
            <div class='flex items-center justify-between text-sm'>
              <span class='text-foreground'>Path of Exile 2</span>
              <span class='text-muted-foreground font-mono text-xs'>
                {store.poeCurrentVersions?.poe2}
              </span>
            </div>
          </div>
        </section>

        <Separator class='bg-border/50' />

        {/* Footer Actions */}
        <section class='space-y-3'>
          <div class='flex gap-2'>
            {chromatic.runtime === "desktop" &&
              (!store.appNeedsRestart ? (
                <Button
                  variant='outline'
                  size='sm'
                  class='flex-1 '
                  onClick={handleUpdate}
                >
                  Check for updates
                </Button>
              ) : (
                <Button
                  variant='default'
                  size='sm'
                  class='flex-1'
                  onClick={relaunchApp}
                >
                  Restart now
                </Button>
              ))}
            <Button variant='outline' size='sm' class='flex-1'>
              <a
                class='size-full flex items-center justify-center'
                href={GITHUB_ISSUE_URL}
                target='_blank'
                rel='noopener noreferrer'
                onClick={openGitHubIssues}
              >
                Report a bug
              </a>
            </Button>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
