import { cn } from "@app/lib/utils";
import type { Component, ComponentProps } from "solid-js";
import { splitProps } from "solid-js";

const Label: Component<ComponentProps<"span">> = (props) => {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <span
      class={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        local.class,
      )}
      {...others}
    />
  );
};

export { Label };
