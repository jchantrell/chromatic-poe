import {
  type ComponentProps,
  type ValidComponent,
  createEffect,
  createSignal,
  onMount,
  splitProps,
} from "solid-js";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { Button } from "@pkgs/ui/button";
import { FolderIcon } from "@pkgs/icons";
import { cn, to } from "@pkgs/lib/utils";
import { store } from "@app/store";
import { platform } from "@tauri-apps/plugin-os";
import { toast } from "solid-sonner";
import chromatic from "@app/lib/config";

export function ChooseDirectory<T extends ValidComponent = "div">(
  props: PolymorphicProps<T>,
) {
  const [directory, setDirectory] = createSignal<string>("");
  const [dirValid, setDirValid] = createSignal(false);

  const [, rest] = splitProps(props as ComponentProps<T>, ["class"]);

  async function chooseLocation() {
    const [, path] = await to(
      chromatic.fileSystem.pickDirectoryPrompt(directory()),
    );
    if (path) setDirectory(path);
  }

  createEffect(async () => {
    if (directory() !== "" && chromatic.fileSystem.runtime === "desktop") {
      const [err, val] = await to(chromatic.fileSystem.exists(directory()));
      if (err || !val) {
        setDirValid(false);
      }
      if (val) {
        setDirValid(true);
      }
    }
  });

  createEffect(async () => {
    if (dirValid() && directory() !== chromatic.config.poeDirectory) {
      console.log("?");
      await chromatic.updatePoeDirectory(directory());
      toast(`Updated PoE directory to ${directory()}`);
      store.initialised = true;
    }
  });

  onMount(async () => {
    if (chromatic.runtime === "web") return;

    const currentPlatform = platform();

    if (chromatic.config.poeDirectory) {
      return setDirectory(chromatic.config.poeDirectory);
    }

    const [, assumedPoeDirLocation] = await to(
      chromatic.getAssumedPoeDirectory(currentPlatform),
    );
    if (assumedPoeDirLocation) {
      const [, dirExists] = await to(
        chromatic.fileSystem.exists(assumedPoeDirLocation),
      );

      if (dirExists) {
        setDirectory(assumedPoeDirLocation);
      }
    }
  });

  return (
    <div class={cn("flex items-center", props.class)} {...rest}>
      <div class='my-4 border min-h-[30px] w-full flex items-center rounded-lg'>
        <Button
          variant='ghost'
          size='icon'
          class='rounded-none'
          onMouseDown={chooseLocation}
        >
          <FolderIcon />
        </Button>
        <div class='overflow-hidden ml-1 w-full'>
          {chromatic.fileSystem.truncatePath(directory())}
        </div>
      </div>
    </div>
  );
}
