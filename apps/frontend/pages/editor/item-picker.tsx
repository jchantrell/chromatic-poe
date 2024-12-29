import { type FilterItem, type FilterRule, itemIndex } from "@app/lib/filter";
import { Checkbox } from "@pkgs/ui/checkbox";
import { createSignal, For } from "solid-js";
import { createMutable } from "solid-js/store";
import { ChevronDownIcon } from "@pkgs/icons";

interface BaseItem {
  name: string;
  category: string;
  class: string;
  type: string | null;
  score: number;
  art: string;
  height: number;
  width: number;
  price: number | null;
  strReq: number | null;
  dexReq: number | null;
  intReq: number | null;
}

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
  data: BaseItem;
}

type TreeNode = BranchNode | LeafNode;

type NestedData = {
  [key: string]: NestedData | BaseItem;
};

function isLeafNode(obj: object): obj is BaseItem {
  return obj.hasOwnProperty("name") && obj.hasOwnProperty("category");
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

      if (bases.some((base) => base.name === value.name)) {
        let current: TreeNode | undefined = node;
        while (current) {
          current.enabled = true;
          current = current.parent;
        }
      }
    } else {
      node.children.push(rollup(value, key, bases, node));
    }
  }

  node.children.sort((a, b) => {
    if ("children" in a && "children" in b) {
      return a.name.localeCompare(b.name);
    }
    if ("data" in a && "data" in b) {
      return (a.data?.price || 0) - (b.data?.price || 0);
    }
    return "children" in a ? -1 : 1;
  });

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

export function ItemPicker(props: { rule: FilterRule }) {
  const itemHierarchy = createMutable(
    rollup(itemIndex.hierarchy, "Items", props.rule.bases),
  );

  function toggleNode(node: TreeNode, enabled: boolean): void {
    node.enabled = enabled;
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
