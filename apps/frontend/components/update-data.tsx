import { ToastProgress } from "@app/components/toast-progress";
import { dat } from "@app/lib/dat";
import { createSignal } from "solid-js";
import { toast } from "solid-sonner";

export async function ensureData(patch: string) {
  const [progress, setProgress] = createSignal(0);
  const [message, setMessage] = createSignal("Initializing...");
  let toastId: string | number | undefined;

  let showedToast = false;

  await dat.extract(patch, (p, m) => {
    if (!showedToast) {
      showedToast = true;
      toastId = toast(<ToastProgress progress={progress} message={message} />, {
        duration: Infinity,
      });
    }
    setProgress(p);
    setMessage(m);
  });

  if (showedToast && typeof toastId === "number") {
    toast.dismiss(toastId);
  }
}
