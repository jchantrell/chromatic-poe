import {
  type FilterItem,
  type FilterRule,
  hasEnabledWithAttribute,
  itemIndex,
} from "@app/lib/filter";
import { Checkbox } from "@pkgs/ui/checkbox";
import { createSignal, For, JSXElement } from "solid-js";
import { createMutable } from "solid-js/store";
import { ChevronDownIcon } from "@pkgs/icons";
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
  data: FilterItem;
}

type TreeNode = BranchNode | LeafNode;

type NestedData = {
  [key: string]: NestedData | FilterItem;
};

function isLeafNode(obj: object): obj is FilterItem {
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
  if (node.data) return node.data.art;
  return getIcon(node.children[0]);
}

function rollup(
  branchData: NestedData,
  branchName: string,
  bases: FilterItem[],
  parent?: BranchNode,
): BranchNode {
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

      if (
        bases.some(
          (base) =>
            base.name === value.name && base.category === value.category,
        )
      ) {
        let current: TreeNode | undefined = leafNode;
        while (current) {
          current.enabled = true;
          current = current.parent;
        }
      }
    } else {
      node.children.push(rollup(value, key, bases, node));
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

  function handleToggle() {
    props.onToggle(props.node, !props.node.enabled);
  }

  function handleExpand() {
    setIsExpanded(!isExpanded());
  }

  return (
    <div class={`select-none ${props.level > 0 ? "ml-4" : ""}`}>
      <div class='flex items-center p-1 hover:bg-accent cursor-pointer'>
        <div class='w-6'>
          {"children" in props.node && (
            <div onMouseDown={handleExpand}>
              <ChevronDownIcon />
            </div>
          )}
        </div>

        <Checkbox
          checked={props.node.enabled}
          onChange={handleToggle}
          class='mx-1'
        />

        <div class='flex items-center flex-grow'>
          <figure class='max-w-lg'>
            <img
              class='mr-1 h-6 max-w-full pointer-events-none'
              alt={`${props.node.data?.name} icon`}
              src={
                "data" in props.node
                  ? props.node.data?.art
                  : getIcon(props.node)
              }
            />
          </figure>
          <span>{props.node.name}</span>
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

function isBranchWithKey(
  node: TreeNode,
  key: keyof FilterItem,
  value: string,
): boolean {
  if (node.data?.[key] === value) return true;
  if ("children" in node && node.children) {
    return node.children.some((child) => isBranchWithKey(child, key, value));
  }
  return false;
}

export function ItemPicker(props: { rule: FilterRule }) {
  const itemHierarchy = createMutable(
    rollup(itemIndex.hierarchy, "Items", props.rule.bases),
  );

  function toggleNode(node: TreeNode, enabled: boolean): void {
    if (node.enabled === enabled) return;

    const isUnique = isBranchWithKey(node, "category", "Uniques");
    const isPinnacleKeys = isBranchWithKey(node, "itemClass", "Pinnacle Keys");
    const isRegularItem = !isUnique && !isPinnacleKeys;

    if (enabled) {
      const hasEnabledUniques = hasEnabledWithAttribute(
        props.rule.bases,
        "category",
        "Uniques",
      );
      const hasEnabledPinnacleKeys = hasEnabledWithAttribute(
        props.rule.bases,
        "itemClass",
        "Pinnacle Keys",
      );
      const hasEnabledRegularItems =
        props.rule.bases.length > 0 &&
        !hasEnabledUniques &&
        !hasEnabledPinnacleKeys;

      if (isUnique && hasEnabledRegularItems) {
        toast("Cannot enable Uniques while regular items are enabled");
        return;
      }
      if (isUnique && hasEnabledPinnacleKeys) {
        toast("Cannot enable Uniques while Pinnacle Keys are enabled");
        return;
      }
      if (isPinnacleKeys && hasEnabledRegularItems) {
        toast("Cannot enable Pinnacle Keys while regular items are enabled");
        return;
      }
      if (isPinnacleKeys && hasEnabledUniques) {
        toast("Cannot enable Pinnacle Keys while Uniques are enabled");
        return;
      }
      if (isRegularItem && (hasEnabledUniques || hasEnabledPinnacleKeys)) {
        toast(
          "Cannot enable regular items while Uniques or Pinnacle Keys are enabled",
        );
        return;
      }
    }

    node.enabled = enabled;

    if (isUnique && enabled) {
      props.rule.conditions.rarity = undefined;
    }

    if ("children" in node && node.children) {
      for (const child of node.children) {
        toggleNode(child, enabled);
      }
    }

    if ("parent" in node) {
      updateParentState(node);
    }

    if ("data" in node) {
      const ruleHasBase = props.rule.bases.some(
        (base) => base.name === node.name,
      );
      if (!ruleHasBase && enabled) {
        props.rule.bases.push({ ...node.data, enabled });
      }

      if (ruleHasBase && !enabled) {
        props.rule.bases = props.rule.bases.filter(
          (base) => base.name !== node.name,
        );
      }
    }
  }

  function updateNode(root: TreeNode, node: TreeNode, enabled: boolean) {
    if (root === node) {
      toggleNode(root, enabled);
    }

    if (root.children) {
      for (const child of root.children) {
        updateNode(child, node, enabled);
      }
    }
  }

  function handleToggle(node: TreeNode, enabled: boolean) {
    updateNode(itemHierarchy, node, enabled);
  }

  return (
    <div class='grid py-2'>
      <For each={itemHierarchy.children}>
        {(item) => <Node node={item} level={0} onToggle={handleToggle} />}
      </For>
    </div>
  );
}
