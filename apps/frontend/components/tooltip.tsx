import {
  Tooltip as Primitive,
  TooltipContent,
  TooltipTrigger,
} from "@pkgs/ui/tooltip";
import type { JSXElement } from "solid-js";

export default function Tooltip(props: { children: JSXElement; text: string }) {
  return (
    <Primitive>
      <TooltipTrigger>{props.children}</TooltipTrigger>
      <TooltipContent>
        <p>{props.text}</p>
      </TooltipContent>
    </Primitive>
  );
}
