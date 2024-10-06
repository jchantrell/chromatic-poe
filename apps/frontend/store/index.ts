import { createMutable } from "solid-js/store";
import type { Filter, ItemHierarchy } from "@app/services/filter";

export const store = createMutable<{
  appBar?: HTMLDivElement;
  initialised: boolean;
  locale: string | null;
  filters: Filter[];
  filter: Filter | null;
  view: ItemHierarchy | null;
  crumbs: { title: string; view: ItemHierarchy }[];
}>({
  appBar: undefined,
  initialised: false,
  locale: null,
  filters: [],
  filter: null,
  view: null,
  crumbs: [],
});
