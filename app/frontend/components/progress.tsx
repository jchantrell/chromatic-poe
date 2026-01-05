import {
  Progress as Atomic,
  ProgressLabel,
  ProgressValueLabel,
} from "@app/ui/progress";
import type { Accessor } from "solid-js";

interface ProgressProps {
  progress: Accessor<number>;
  message: Accessor<string>;
}

export function Progress(props: ProgressProps) {
  return (
    <div class='p-2'>
      <Atomic
        value={props.progress()}
        minValue={0}
        maxValue={100}
        class='w-[300px] space-y-1'
      >
        <div class='flex justify-between'>
          <ProgressLabel class='truncate flex-1 min-w-0 mr-2'>
            {props.message().length > 35
              ? `${props.message().slice(0, 35)}..`
              : props.message()}
          </ProgressLabel>
          <ProgressValueLabel />
        </div>
      </Atomic>
    </div>
  );
}
