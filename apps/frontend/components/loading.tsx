import { LoadCircleIcon } from "@app/icons";

export function Loading() {
  return (
    <div class='size-full flex justify-center items-center'>
      <LoadCircleIcon class='animate-spin' />
    </div>
  );
}
