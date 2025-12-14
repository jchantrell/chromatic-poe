import { useColorMode } from "@kobalte/core";
import type { JSXElement } from "solid-js";

export default function Background(props: { children: JSXElement }) {
  const { colorMode } = useColorMode();
  return (
    <div
      class={`bg-no-repeat bg-center bg-cover size-full ${
        colorMode() === "dark"
          ? "bg-[url('/bg-dark.jpg')]"
          : "bg-[url('/bg-light.jpg')]"
      }`}
    >
      {props.children}
    </div>
  );
}
