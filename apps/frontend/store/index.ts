import type { Filter, FilterRule } from "@app/lib/filter";
import { createMutable } from "solid-js/store";

interface Store {
  activeRule: FilterRule | null;
  filter: Filter | null;
  filters: Filter[];
  initialised: boolean;
  locale: null | string;
}

export const store = createMutable<Store>({
  activeRule: null,
  filter: null,
  filters: [],
  initialised: false,
  locale: null,
});

export function removeFilter(filter: Filter) {
  store.filters = store.filters.filter((entry) => filter.name !== entry.name);
}

export function addFilter(filter: Filter) {
  store.filters.push(filter);
}

export function setFilter(filter: Filter) {
  store.filter = filter;
}

export function setInitialised(state: boolean) {
  store.initialised = state;
}

export function setLocale(locale: string | null) {
  store.locale = locale;
}
