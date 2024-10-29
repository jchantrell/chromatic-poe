import {
  type FilterHierarchy,
  type FilterCategory,
  FilterItem,
} from "@app/lib/filter";
import { createMutable } from "solid-js/store";

export class FilterRule implements FilterHierarchy {
  id: string;
  name: string;
  type = "rule" as const;
  icon: string | null = null;
  enabled: boolean;
  conditions?: { [key: string]: string[] }[];
  actions?: { [key: string]: string[] }[];
  parent?: FilterCategory;
  children: FilterItem[] = [];

  constructor(props: {
    id: string;
    name: string;
    enabled: boolean;
    children: FilterItem[];
    conditions?: { [key: string]: string[] }[];
    actions?: { [key: string]: string[] }[];
  }) {
    this.id = props.id;
    this.name = props.name;
    this.enabled = props.enabled;
    this.conditions = props.conditions ? props.conditions : [];
    this.actions = props.actions ? props.actions : [];
    this.children = props.children.map((entry) => new FilterItem(entry));

    createMutable(this);
  }
}
