import { createMutable } from "solid-js/store";
import type { Filter, ItemHierarchy } from "@app/constants";

export const store = createMutable<{
  initialised: boolean;
  locale: string | null;
  filters: Filter[];
  filter: Filter | null;
  view: ItemHierarchy | null;
  crumbs: { title: string; view: ItemHierarchy }[];
}>({
  initialised: false,
  locale: null,
  filters: [
    {
      name: "Mock Filter",
      version: 3,
      lastUpdated: new Date().toISOString(),
      rules: { name: "Items", type: "root", parent: null, children: [] },
    },
    {
      name: "Another Mock Filter",
      version: 1,
      lastUpdated: new Date().toISOString(),
      rules: { name: "Items", type: "root", parent: null, children: [] },
    },
  ],
  filter: null,
  view: null,
  crumbs: [],
});
