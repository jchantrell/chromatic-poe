import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@pkgs/ui/breadcrumb";
import { store } from "@app/store";
import { For } from "solid-js";
import type { ItemHierarchy } from "@app/types";

export type Crumb = { title: string; view: ItemHierarchy };

function Crumbs(props: { class: string }) {
  function setCrumbs(crumb: Crumb, index: number) {
    if (crumb.view) {
      store.view = crumb.view;
    }
    store.crumbs = [...store.crumbs.slice(0, index + 1)];
  }

  return (
    <>
      <Breadcrumb class={props.class}>
        {store.crumbs.length > 0 ? (
          <BreadcrumbList>
            <For each={store.crumbs}>
              {(crumb, i) => {
                return (
                  <>
                    <BreadcrumbItem
                      onMouseDown={(e) => {
                        if (!e.target.ariaDisabled) {
                          setCrumbs(crumb, i());
                        }
                      }}
                    >
                      <BreadcrumbLink
                        class='cursor-pointer text-lg'
                        current={i() === store.crumbs.length - 1}
                      >
                        {crumb.title}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    {i() < store.crumbs.length - 1 ? (
                      <BreadcrumbSeparator />
                    ) : (
                      <></>
                    )}
                  </>
                );
              }}
            </For>
          </BreadcrumbList>
        ) : (
          <></>
        )}
      </Breadcrumb>
    </>
  );
}

export default Crumbs;
