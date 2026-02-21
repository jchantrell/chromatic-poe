import { SettingsIcon } from "@app/icons";
import chromatic from "@app/lib/config";
import { checkForUpdate, relaunchApp } from "@app/lib/update";
import { to } from "@app/lib/utils";
import { setSettingsOpen, store } from "@app/store";
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
import { platform } from "@tauri-apps/plugin-os";
import { createEffect, createSignal, on, Show } from "solid-js";
import { toast } from "solid-sonner";
import Theme from "./theme";

const GITHUB_ISSUE_URL = "https://github.com/jchantrell/chromatic-poe/issues";

function DirectoryPicker(props: {
  label: string;
  value: string | null | undefined;
  onPick: () => void;
}) {
  return (
    <>
      <Label class='text-sm text-foreground'>{props.label}</Label>
      <span
        class='text-xs text-muted-foreground truncate'
        style={{ direction: "rtl", "text-align": "left" }}
        title={props.value ?? "Not set"}
      >
        {props.value ?? "Not set"}
      </span>
      <Button variant='outline' size='sm' onClick={props.onPick}>
        Change
      </Button>
    </>
  );
}

export function Settings() {
  const [version, setVersion] = createSignal("0.0.0");
  const [poe1Dir, setPoe1Dir] = createSignal<string | null | undefined>(
    chromatic.config?.poe1Directory,
  );
  const [poe2Dir, setPoe2Dir] = createSignal<string | null | undefined>(
    chromatic.config?.poe2Directory,
  );

  const isLinux = () =>
    chromatic.runtime === "desktop" && platform() === "linux";

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

  async function handlePickDirectory(poeVersion: 1 | 2) {
    const path = await chromatic.pickPoeDirectory(poeVersion);
    if (path) {
      await chromatic.setPoeDirectory(poeVersion, path);
      if (poeVersion === 1) {
        setPoe1Dir(path);
      } else {
        setPoe2Dir(path);
      }
      toast.success(`PoE${poeVersion} directory set`);
    }
  }

  createEffect(
    on(
      () => store.initialised,
      async (ready) => {
        if (!ready) return;
        setVersion(await chromatic.getVersion());
        setPoe1Dir(chromatic.config?.poe1Directory);
        setPoe2Dir(chromatic.config?.poe2Directory);
      },
    ),
  );

  return (
    <Dialog open={store.settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogTrigger variant='ghost' as={Button<"button">}>
        <SettingsIcon />
      </DialogTrigger>
      <DialogContent class='sm:max-w-[550px]'>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        {/* General Section */}
        <section class='space-y-3'>
          <h3 class='text-sm font-medium text-muted-foreground'>General</h3>
          <div class='grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-2'>
            <Label class='text-sm text-foreground'>Autosave</Label>
            <Checkbox disabled checked={false} />
          </div>
        </section>

        <Separator class='bg-border/50' />

        {/* Display Section */}
        <section class='space-y-3'>
          <h3 class='text-sm font-medium text-muted-foreground'>Display</h3>
          <div class='grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-2'>
            <Label class='text-sm text-foreground'>Theme</Label>
            <Theme />
          </div>
        </section>

        <Separator class='bg-border/50' />

        {/* Directories Section - Linux Only */}
        <Show when={isLinux()}>
          <section class='space-y-3'>
            <h3 class='text-sm font-medium text-muted-foreground'>
              Directories
            </h3>
            <div class='grid grid-cols-[6rem_1fr_auto] items-center gap-x-4 gap-y-2'>
              <DirectoryPicker
                label='Path of Exile 1'
                value={poe1Dir()}
                onPick={() => handlePickDirectory(1)}
              />
              <DirectoryPicker
                label='Path of Exile 2'
                value={poe2Dir()}
                onPick={() => handlePickDirectory(2)}
              />
            </div>
          </section>

          <Separator class='bg-border/50' />
        </Show>

        {/* Versions Section */}
        <section class='space-y-3'>
          <h3 class='text-sm font-medium text-muted-foreground'>Versions</h3>
          <div class='grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-1 text-sm'>
            <span class='text-foreground'>Chromatic</span>
            <span class='text-muted-foreground font-mono text-xs'>
              {version()}
            </span>
            <span class='text-foreground'>Path of Exile 1</span>
            <span class='text-muted-foreground font-mono text-xs'>
              {store.poeCurrentVersions?.poe1}
            </span>
            <span class='text-foreground'>Path of Exile 2</span>
            <span class='text-muted-foreground font-mono text-xs'>
              {store.poeCurrentVersions?.poe2}
            </span>
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
