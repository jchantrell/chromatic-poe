import { ConditionKey, Rarity, RarityCondition } from "@app/lib/condition";
import { dat } from "@app/lib/dat";
import type { FilterItem, FilterRule, Item } from "@app/lib/filter";
import { itemIndex } from "@app/lib/items";
import { Checkbox } from "@app/ui/checkbox";
import { TextField, TextFieldInput } from "@app/ui/text-field";
import {
  batch,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  on,
  onCleanup,
  untrack,
} from "solid-js";
import { createMutable } from "solid-js/store";
import { toast } from "solid-sonner";

interface BranchNode {
  name: string;
  enabled: boolean;
  parent?: BranchNode;
  children: TreeNode[];
  data?: never;
}

interface LeafNode {
  name: string;
  enabled: boolean;
  parent?: BranchNode;
  children?: never;
  data: Item;
}

type TreeNode = BranchNode | LeafNode;

type NestedData = {
  [key: string]: NestedData | Item;
};

function isLeafNode(obj: object): obj is Item {
  return "name" in obj && "category" in obj;
}

function updateParentState(node: TreeNode) {
  if (node.parent) {
    const activeChildren = node.parent.children.some((child) => child.enabled);
    node.parent.enabled = activeChildren;
    updateParentState(node.parent);
  }
}

function getIcon(node: TreeNode) {
  if (node.data) return node.name;
  return getIcon(node.children[0]);
}

function rollup(
  branchData: NestedData,
  branchName: string,
  bases: FilterItem[],
  parent?: BranchNode,
  basesSet?: Set<string>,
): BranchNode {
  if (!basesSet) {
    basesSet = new Set(bases.map((base) => `${base.name}|${base.category}`));
  }

  const node: BranchNode = {
    name: branchName,
    enabled: false,
    parent,
    children: [],
  };

  for (const [key, value] of Object.entries(branchData)) {
    if (isLeafNode(value)) {
      const leafNode: LeafNode = {
        name: value.name,
        enabled: false,
        parent: node,
        data: value,
      };
      node.children.push(leafNode);

      if (basesSet.has(`${value.name}|${value.category}`)) {
        let current: TreeNode | undefined = leafNode;
        while (current) {
          current.enabled = true;
          current = current.parent;
        }
      }
    } else {
      node.children.push(rollup(value, key, bases, node, basesSet));
    }
  }

  return node;
}

function Node(props: {
  node: TreeNode;
  level: number;
  onToggle: (node: TreeNode, enabled: boolean) => void;
}) {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const isBranch = "children" in props.node;

  const handleToggle = () => {
    props.onToggle(props.node, !props.node.enabled);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded());
  };

  const icon = createMemo(() => getIcon(props.node));

  const [art] = createResource(icon, async (iconName) => {
    if (!iconName) return null;
    return await dat.getArt(iconName);
  });

  return (
    <div class={`select-none ${props.level > 0 ? "ml-4" : ""}`}>
      <div class='flex items-center p-1 hover:bg-accent/60 cursor-pointer'>
        <Checkbox
          checked={props.node.enabled}
          onChange={handleToggle}
          class='mr-2 py-1 flex items-center justify-center h-full'
        />

        <div class='flex items-center grow' onMouseDown={handleExpand}>
          {art() && (
            <figure class='max-w-lg'>
              <img
                class='mr-1 h-6 max-w-full pointer-events-none'
                alt={`${props.node.data?.name} icon`}
                src={art()}
              />
            </figure>
          )}
          <span>
            {props.node.name}
            {props.node.data?.category === "Uniques" && (
              <span class='ml-1 text-xs text-neutral-400'>
                {" "}
                {props.node.data?.base}
              </span>
            )}
          </span>
        </div>
      </div>

      {isBranch && isExpanded() && (
        <For each={props.node.children}>
          {(child) => (
            <Node
              node={child}
              level={props.level + 1}
              onToggle={props.onToggle}
            />
          )}
        </For>
      )}
    </div>
  );
}

export function ItemPicker(props: { rule: FilterRule }) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const itemHierarchy = createMutable({
    hierarchy: rollup(itemIndex.hierarchy, "Items", props.rule.bases),
  });

  const pendingChanges = {
    toAdd: [] as FilterItem[],
    toRemove: new Set<string>(),
  };

  function toggle(node: TreeNode, enabled: boolean): void {
    if (node.enabled === enabled) return;

    node.enabled = enabled;

    if ("children" in node && node.children) {
      for (const child of node.children) {
        toggle(child, enabled);
      }
    }
  }

  function collectLeaves(
    node: TreeNode,
    leaves: (LeafNode | TreeNode)[],
  ): void {
    if ("data" in node) {
      leaves.push(node);
    } else if ("children" in node) {
      for (const child of node.children) {
        collectLeaves(child, leaves);
      }
    }
  }

  function handleToggle(node: TreeNode, enabled: boolean) {
    batch(() => {
      toggle(node, enabled);

      if (node.parent) {
        updateParentState(node);
      }

      const leaves: LeafNode[] = [];
      collectLeaves(node, leaves);

      if (enabled) {
        const existingNames = new Set(props.rule.bases.map((b) => b.name));

        leaves.forEach((leaf) => {
          if (!existingNames.has(leaf.data.name)) {
            pendingChanges.toAdd.push({
              name: leaf.data.name,
              base: leaf.data.base,
              category: leaf.data.category,
              enabled,
            });
            pendingChanges.toRemove.delete(leaf.data.name);
          }
        });
      } else {
        leaves.forEach((leaf) => {
          pendingChanges.toRemove.add(leaf.data.name);
          pendingChanges.toAdd = pendingChanges.toAdd.filter(
            (item) => item.name !== leaf.data.name,
          );
        });
      }
    });
  }

  onCleanup(() => {
    batch(() => {
      if (pendingChanges.toAdd.length > 0) {
        props.rule.bases.push(...pendingChanges.toAdd);
      }

      if (pendingChanges.toRemove.size > 0) {
        props.rule.bases = props.rule.bases.filter(
          (base) => !pendingChanges.toRemove.has(base.name),
        );
      }
    });
  });

  return (
    <div class='p-2'>
      <div class='py-2'>
        <TextField value={searchTerm()} onChange={setSearchTerm}>
          <TextFieldInput type='text' placeholder='Search for items...' />
        </TextField>
      </div>
      <div class='overflow-y-auto h-[50vh] p-2'>
        <For each={itemHierarchy.hierarchy.children}>
          {(item) => <Node node={item} level={0} onToggle={handleToggle} />}
        </For>
      </div>
    </div>
  );
}
