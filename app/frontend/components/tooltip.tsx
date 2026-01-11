import {
  Tooltip as Primitive,
  TooltipContent,
  TooltipTrigger,
} from "@app/ui/tooltip";
import type { JSXElement } from "solid-js";

export default function Tooltip(props: { children: JSXElement; text: string }) {
  return (
    <Primitive>
      <TooltipTrigger>{props.children}</TooltipTrigger>
      <TooltipContent
        class='bg-neutral-900 border border-accent'
        onMouseEnter={(e) => e.preventDefault()}
      >
        <p>{props.text}</p>
      </TooltipContent>
    </Primitive>
  );
}
