import {
  type FilterHierarchy,
  type FilterRoot,
  FilterRule,
} from "@app/lib/filter";
import { createMutable } from "solid-js/store";

export class FilterCategory implements FilterHierarchy {
  id: string;
  name: string;
  type = "category" as const;
  icon: string | null = null;
  enabled: boolean;
  conditions?: { [key: string]: string[] }[];
  actions?: { [key: string]: string[] }[];
  parent?: FilterRoot | FilterCategory;
  children: (FilterRule | FilterCategory)[] = [];

  constructor(props: {
    id: string;
    name: string;
    enabled: boolean;
    children: (FilterRule | FilterCategory)[];
    conditions?: { [key: string]: string[] }[];
    actions?: { [key: string]: string[] }[];
  }) {
    this.id = props.id;
    this.name = props.name;
    this.enabled = props.enabled;
    this.conditions = props.conditions ? props.conditions : [];
    this.actions = props.actions ? props.actions : [];
    this.children = props.children.map((entry) => {
      if (entry.type === "category") return new FilterCategory(entry);
      if (entry.type === "rule") return new FilterRule(entry);
    }) as (FilterRule | FilterCategory)[];
    createMutable(this);
  }
}
