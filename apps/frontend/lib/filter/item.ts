import type { FilterRule, FilterHierarchy } from "@app/lib/filter";
import { createMutable } from "solid-js/store";

export class FilterItem implements FilterHierarchy {
  id: string;
  name: string;
  type = "item" as const;
  icon: string;
  value: number | null = null;
  enabled: boolean;
  parent?: FilterRule;

  constructor(props: {
    id: string;
    name: string;
    enabled: boolean;
    icon: string;
    value: number | null;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.enabled = props.enabled;
    this.icon = props.icon;
    this.value = props.value;
    createMutable(this);
  }
}
