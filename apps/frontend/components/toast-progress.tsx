import { Progress, ProgressLabel, ProgressValueLabel } from "@app/ui/progress";
import type { Accessor } from "solid-js";

interface ToastProgressProps {
  progress: Accessor<number>;
  message: Accessor<string>;
}

export function ToastProgress(props: ToastProgressProps) {
  return (
    <div class='p-2'>
      <Progress
        value={props.progress()}
        minValue={0}
        maxValue={100}
        class='w-[300px] space-y-1'
      >
        <div class='flex justify-between'>
          <ProgressLabel>{props.message()}</ProgressLabel>
          <ProgressValueLabel />
        </div>
      </Progress>
    </div>
  );
}
