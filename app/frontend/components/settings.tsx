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
import { createSignal, onMount, Show } from "solid-js";
import { toast } from "solid-sonner";
import Theme from "./theme";

const GITHUB_ISSUE_URL = "https://github.com/jchantrell/chromatic-poe/issues";

function truncatePath(path: string | null | undefined, maxLength = 30): string {
  if (!path) return "Not set";
  if (path.length <= maxLength) return path;
  return `...${path.slice(-maxLength)}`;
}

function DirectoryPicker(props: {
  label: string;
  value: string | null | undefined;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div class='flex items-center justify-between py-1'>
      <Label class='text-sm text-foreground'>{props.label}</Label>
      <div class='flex items-center gap-2'>
        <span
          class='text-xs text-muted-foreground truncate max-w-[150px]'
          title={props.value ?? "Not set"}
        >
          {truncatePath(props.value)}
        </span>
        <Button variant='outline' size='sm' onClick={props.onPick}>
          {props.value ? "Change" : "Set"}
        </Button>
        <Show when={props.value}>
          <Button variant='ghost' size='sm' onClick={props.onClear}>
            Clear
          </Button>
        </Show>
      </div>
    </div>
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

  async function handleClearDirectory(poeVersion: 1 | 2) {
    await chromatic.setPoeDirectory(poeVersion, null);
    if (poeVersion === 1) {
      setPoe1Dir(null);
    } else {
      setPoe2Dir(null);
    }
    toast(`PoE${poeVersion} directory cleared`);
  }

  onMount(async () => {
    setVersion(await chromatic.getVersion());
    setPoe1Dir(chromatic.config?.poe1Directory);
    setPoe2Dir(chromatic.config?.poe2Directory);
  });

  return (
    <Dialog open={store.settingsOpen} onOpenChange={setSettingsOpen}>
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

        {/* Directories Section - Linux Only */}
        <Show when={isLinux()}>
          <section class='space-y-3'>
            <h3 class='text-sm font-medium text-muted-foreground'>
              Directories
            </h3>
            <DirectoryPicker
              label='Path of Exile 1'
              value={poe1Dir()}
              onPick={() => handlePickDirectory(1)}
              onClear={() => handleClearDirectory(1)}
            />
            <DirectoryPicker
              label='Path of Exile 2'
              value={poe2Dir()}
              onPick={() => handlePickDirectory(2)}
              onClear={() => handleClearDirectory(2)}
            />
          </section>

          <Separator class='bg-border/50' />
        </Show>

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
