import { type FilterItem, type FilterRule, itemIndex } from "@app/lib/filter";
import { Button } from "@pkgs/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@pkgs/ui/dialog";
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
  children: TreeNode[];
  data?: never; // Branch nodes don't have data
}

interface LeafNode {
  name: string;
  enabled: boolean;
  children?: never; // Leaf nodes don't have children
  data: BaseItem;
}

type TreeNode = BranchNode | LeafNode;

type NestedData = {
  [key: string]: NestedData | BaseItem;
};

function transformData(
  data: NestedData,
  bases: FilterItem[],
  rootName = "Items",
): BranchNode {
  function isLeafNode(obj: object): obj is BaseItem {
    return obj.hasOwnProperty("name") && obj.hasOwnProperty("category");
  }

  function processBranch(
    branchData: NestedData,
    branchName: string,
  ): BranchNode {
    const node: BranchNode = {
      name: branchName,
      enabled: false,
      children: [],
    };

    for (const [key, value] of Object.entries(branchData)) {
      if (isLeafNode(value)) {
        const leafNode: LeafNode = {
          name: value.name,
          enabled: bases.some(
            (base) => base.name === value.name && base.enabled,
          ),
          data: value,
        };
        node.children.push(leafNode);
      } else {
        node.children.push(processBranch(value, key));
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

  return processBranch(data, rootName);
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

        {/* Node name with optional price for leaf nodes */}
        <div class='flex items-center flex-grow'>
          {"data" in props.node && (
            <figure class='max-w-lg'>
              <img
                class='mr-1 h-6 max-w-full pointer-events-none'
                alt={`${props.node.data?.name} icon`}
                src={props.node.data?.art}
              />
            </figure>
          )}
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
    transformData(itemIndex.hierarchy, props.rule.bases),
  );

  function toggleNode(node: TreeNode, enabled: boolean): void {
    node.enabled = enabled;
    console.log(node.name);
    if ("children" in node && node.children) {
      for (const child of node.children) {
        toggleNode(child, enabled);
      }
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
    <Dialog>
      <DialogTrigger variant='secondary' as={Button<"button">}>
        Edit bases
      </DialogTrigger>
      <DialogContent class='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>Select bases</DialogTitle>
        </DialogHeader>
        <div class='grid py-2'>
          <For each={itemHierarchy.children}>
            {(item) => <Node node={item} level={0} onToggle={handleToggle} />}
          </For>
        </div>
      </DialogContent>
    </Dialog>
  );
}
