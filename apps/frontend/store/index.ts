import type {
  Filter,
  FilterRoot,
  FilterCategory,
  FilterRule,
  FilterItem,
} from "@app/lib/filter";
import { Reaction, action, makeAutoObservable } from "mobx";
import { enableExternalSource } from "solid-js";

const enableMobXWithSolidJS = () => {
  let id = 0;
  enableExternalSource((fn, trigger) => {
    const reaction = new Reaction(`externalSource@${++id}`, trigger);
    return {
      track: (x) => {
        let next;
        reaction.track(() => (next = fn(x)));
        return next;
      },
      dispose: () => {
        reaction.dispose();
      },
    };
  });
};

enableMobXWithSolidJS();

export class Store {
  activeView: FilterRoot | FilterCategory | null = null;
  filter: Filter | null = null;
  filters: Filter[] = [];
  rules: { [key: string]: FilterRule } = {};
  items: { [key: string]: FilterItem } = {};
  crumbs: { title: string; view: FilterRoot | FilterCategory }[] = [];
  initialised = false;
  locale: null | string = null;

  constructor() {
    makeAutoObservable(this, {
      addFilter: action,
      setFilter: action,
      setActiveView: action,
      setInitialised: action,
      setLocale: action,
    });
  }

  addFilter(filter: Filter) {
    this.filters.push(filter);
  }

  setFilter(filter: Filter) {
    this.filter = filter;
  }

  setActiveView(view: FilterRoot | FilterCategory | null) {
    this.activeView = view;
  }

  setInitialised(state: boolean) {
    this.initialised = state;
  }

  setLocale(locale: string | null) {
    this.locale = locale;
  }
}

export const store = new Store();
