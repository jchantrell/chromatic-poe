import type {
  Filter,
  FilterRoot,
  FilterCategory,
  FilterRule,
} from "@app/lib/filter";
import type { Crumb } from "@app/pages/editor/components/crumbs";
import { createMutable } from "solid-js/store";

interface Store {
  activeRule: FilterRule | null;
  activeView: FilterRoot | FilterCategory | null;
  filter: Filter | null;
  filters: Filter[];
  crumbs: Crumb[];
  initialised: boolean;
  locale: null | string;
}

export const store = createMutable<Store>({
  activeRule: null,
  activeView: null,
  filter: null,
  filters: [],
  crumbs: [],
  initialised: false,
  locale: null,
});

export function removeFilter(filter: Filter) {
  store.filters.filter((entry) => filter.name !== entry.name);
}

export function addFilter(filter: Filter) {
  store.filters.push(filter);
}

export function setFilter(filter: Filter) {
  store.filter = filter;
}

export function setActiveView(view: FilterRoot | FilterCategory | null) {
  store.activeView = view;
}

export function setInitialised(state: boolean) {
  store.initialised = state;
}

export function setLocale(locale: string | null) {
  store.locale = locale;
}

export function setCrumbs(crumbs: Crumb[]) {
  store.crumbs = crumbs;
}
