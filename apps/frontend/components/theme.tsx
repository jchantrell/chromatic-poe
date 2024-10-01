import { useColorMode } from "@kobalte/core";
import { createEffect, createSignal, on, onMount } from "solid-js";
import { SunIcon, MoonIcon } from "@pkgs/icons";

export type ThemeNames = "light" | "dark" | "system";

export function Theme() {
  const { setColorMode } = useColorMode();

  const [theme, setTheme] = createSignal<ThemeNames>("system");

  const root =
    typeof document !== "undefined" ? document.documentElement : null;

  onMount(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
      setTheme((localStorage.getItem("theme") as ThemeNames) || "system");
    } else if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }
  });

  createEffect(
    on(theme, () => {
      if (root && theme() === "light") {
        root.classList.remove("theme-dark");
      } else if (root && theme() === "dark") {
        root.classList.add("theme-dark");
      }
      localStorage.setItem("theme", theme());
      setColorMode(theme());
    }),
  );

  return (
    <>
      {theme() === "dark" ? (
        <SunIcon onMouseDown={() => setTheme("light")} />
      ) : (
        <MoonIcon onMouseDown={() => setTheme("dark")} />
      )}
    </>
  );
}

export default Theme;
