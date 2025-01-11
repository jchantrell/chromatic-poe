import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "solid-sonner";
import { store } from "@app/store";
import chromatic from "@app/lib/config";
import { timeSince } from "@pkgs/lib/utils";

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = [
    "Bytes",
    "KiB",
    "MiB",
    "GiB",
    "TiB",
    "PiB",
    "EiB",
    "ZiB",
    "YiB",
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}
export async function checkForUpdate(): Promise<void> {
  if (chromatic.runtime === "web") return;
  const toastId = toast.info("Checking for updates...");
  const update = await check();
  if (update) {
    toast.info("Update available.", {
      id: toastId,
      action: {
        label: "Download",
        onClick: async () => {
          const updated = await updateApplication();
          if (updated) {
            store.appNeedsRestart = true;
          }
        },
      },
    });
  }
  if (!update) {
    toast.info("Up to date.", {
      id: toastId,
    });
  }
}

export async function updateApplication(): Promise<boolean> {
  if (chromatic.runtime === "web") return false;
  const update = await check();
  let updated = false;
  if (update) {
    const toastId = toast.info(
      `Found update from ${timeSince(new Date(update.date?.split(" ")[0]))}...`,
      {
        description: `Updating to ${update.version}...`,
      },
    );
    let downloaded = 0;
    let contentLength = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength ?? 0;
          toast.info(`Started downloading ${formatBytes(contentLength)}`, {
            id: toastId,
          });
          break;
        case "Progress":
          downloaded += event.data.chunkLength;
          toast.info(
            `Downloaded ${formatBytes(downloaded)} / ${formatBytes(contentLength)}...`,
            {
              id: toastId,
              duration: Number.POSITIVE_INFINITY,
            },
          );
          break;
        case "Finished":
          toast.success("Update installed. Click to restart now.", {
            id: toastId,
            duration: Number.POSITIVE_INFINITY,
            action: {
              label: "Restart",
              onClick: async () => {
                await relaunch();
              },
            },
          });
          updated = true;

          break;
      }
    });
  }
  return updated;
}

export async function relaunchApp() {
  await relaunch();
}
