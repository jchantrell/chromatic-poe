import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "solid-sonner";

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

export async function checkForUpdate(): Promise<boolean> {
  const update = await check();
  const toastId = toast("Checking for update...");
  let updated = false;
  if (update) {
    toast.info(`Found update ${update.version} from ${update.date}...`, {
      id: toastId,
    });
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
  if (!update) {
    toast.info("Already up to date.", {
      id: toastId,
    });
  }
  return updated;
}

export async function relaunchApp() {
  await relaunch();
}
