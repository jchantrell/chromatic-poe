import { createMutable } from "solid-js/store";
import type { FilterCategory, Filter, FilterRoot } from "@app/lib/filter";

export const store = createMutable<{
  appBar?: HTMLDivElement;
  initialised: boolean;
  locale: string | null;
  filters: Filter[];
  filter: Filter | null;
  view: FilterRoot | FilterCategory | null;
  crumbs: { title: string; view: FilterRoot | FilterCategory }[];
}>({
  appBar: undefined,
  initialised: false,
  locale: null,
  filters: [],
  filter: null,
  view: null,
  crumbs: [],
});
