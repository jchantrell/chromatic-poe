import { FolderIcon, TickIcon } from "@pkgs/icons";
import { Button } from "@pkgs/ui/button";
import { fileSystem } from "@app/services/storage";
import { to } from "@pkgs/lib/utils";
import { platform } from "@tauri-apps/plugin-os";
import { createEffect, createSignal, onMount } from "solid-js";
import { store } from "@app/store";

function Setup() {
  const [directory, setDirectory] = createSignal<string>("");
  const [dirValid, setDirValid] = createSignal(false);

  async function chooseLocation() {
    const [, path] = await to(fileSystem.pickDirectoryPrompt(directory()));
    if (path) setDirectory(path);
  }

  async function handleSubmit() {
    if (!dirValid()) {
      return;
    }

    await fileSystem.updatePoeDirectory(directory());
    store.initialised = true;
  }

  createEffect(async () => {
    if (directory() !== "") {
      // TODO: can probably do additional checks
      const [err, val] = await to(fileSystem.checkPoeDirectory(directory()));
      console.log(err, val, directory());
      if (err || !val) {
        setDirValid(false);
      }
      if (val) {
        setDirValid(true);
      }
    }
  });

  onMount(async () => {
    const currentPlatform = platform();

    const [, assumedPoeDirLocation] = await to(
      fileSystem.getAssumedPoeDirectory(currentPlatform),
    );
    if (assumedPoeDirLocation) {
      const [, dirExists] = await to(
        fileSystem.checkPoeDirectory(assumedPoeDirLocation),
      );

      if (dirExists) {
        setDirectory(assumedPoeDirLocation);
        setDirValid(true);
      }
    }
  });

  return (
    <div class='flex h-full flex-col justify-center items-center'>
      <div class='sm:max-w-[600px] text-center'>
        <div class='text-xl mb-2'>Welcome, exile!</div>
        <div>
          Please select the Path of Exile filter directory on your system.
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
              {fileSystem.truncatePath(directory())}
            </div>
          </div>
          <Button
            class={`ml-1 rounded-lg ${dirValid() ? "hover:bg-green-700" : "hover:bg-destructive"}`}
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
