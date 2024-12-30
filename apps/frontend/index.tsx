/* @refresh reload */
import { render } from "solid-js/web";
import { Router } from "@solidjs/router";
import { routes } from "./app";

render(
  () => <Router>{routes}</Router>,
  document.getElementById("root") as HTMLElement,
);
