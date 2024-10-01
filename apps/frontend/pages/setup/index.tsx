import { FolderIcon, TickIcon } from "@pkgs/icons";
import { Button } from "@pkgs/ui/button";
import { fileSystem } from "@app/services/storage";
import { to } from "@pkgs/lib/utils";
import { sep } from "@tauri-apps/api/path";
import { platform } from "@tauri-apps/plugin-os";
import { createSignal, onMount } from "solid-js";
import { store } from "@app/store";

function Setup() {
  const [os, setOs] = createSignal<string | null>(null);
  const [location, setLocation] = createSignal<string | null>(null);
  const [assumedLocation, setAssumedLocation] = createSignal<string | null>(
    null,
  );

  async function chooseLocation() {
    const defaultPath = assumedLocation();
    const [, path] = await to(
      fileSystem.pickDirectoryPrompt(defaultPath ? defaultPath : ""),
    );
    if (path) setLocation(path);
  }

  async function handleSubmit() {
    if (!location()) return;
    await fileSystem.updateFilterPath(location() as string);
    store.initialised = true;
  }

  function truncatePath(path: string) {
    const split = path.split(sep());
    return split.slice(Math.max(split.length - 3, 0)).join(sep());
  }

  onMount(async () => {
    const currentPlatform = platform();
    const [, assumedLocation] = await to(
      fileSystem.getFilterPath(currentPlatform),
    );
    setOs(currentPlatform);
    if (assumedLocation) setAssumedLocation(assumedLocation);
  });

  return (
    <div class='flex h-full flex-col justify-center items-center'>
      <div class='sm:max-w-[600px] text-center'>
        <div class='text-xl mb-2'>Welcome, exile!</div>
        <div>
          Please select the Path of Exile filter directory on your system.
        </div>
        <div class='text-xs'>
          {assumedLocation() ? (
            <>
              We've detected you're on {os()}, so it's likely at:
              <div class='text-xs text-muted-foreground'>
                {assumedLocation()}
              </div>
            </>
          ) : (
            ""
          )}
        </div>
        <div class='flex items-center'>
          <div class='my-4 border min-h-[30px] w-full flex items-center rounded-lg'>
            <Button
              variant='ghost'
              size='icon'
              class='rounded-none'
              onMouseDown={chooseLocation}
            >
              <FolderIcon />
            </Button>
            <div class='overflow-hidden ml-2'>
              {location() ? truncatePath(location() as string) : ""}
            </div>
          </div>
          <Button
            class='ml-1 rounded-lg'
            variant='outline'
            onClick={handleSubmit}
          >
            <TickIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Setup;
