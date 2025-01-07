import {
  type Item,
  type FilterItem,
  type FilterRule,
  itemIndex,
  Operator,
  Rarity,
} from "@app/lib/filter";
import { Checkbox } from "@pkgs/ui/checkbox";
import { createSignal, For } from "solid-js";
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
  if (node.data)
    return itemIndex.itemTable[node.data.category][node.data.name].art;
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
                "data" in props.node && props.node?.data
                  ? itemIndex.itemTable[props.node.data.category][
                      props.node.data?.name
                    ].art
                  : getIcon(props.node)
              }
            />
          </figure>
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
  const itemHierarchy = createMutable(
    rollup(itemIndex.hierarchy, "Items", props.rule.bases),
  );

  function toggleNode(node: TreeNode, enabled: boolean): void {
    if (node.enabled === enabled) return;

    node.enabled = enabled;

    if ("children" in node && node.children) {
      for (const child of node.children) {
        toggleNode(child, enabled);
      }
    }

    if ("parent" in node) {
      updateParentState(node);
    }

    if ("data" in node && node.data) {
      if (node.data.category === "Uniques") {
        if (
          enabled &&
          !props.rule.conditions.rarity?.value.includes(Rarity.UNIQUE)
        ) {
          toast.info("Adding 'Unique' rarity condition to rule.", {
            description:
              "Uniques are filtered by base type (the small grey text next to the unique's name) so a rarity condition of 'Unique' is required to separate them from other rarities.",
            duration: 10000,
          });
          props.rule.conditions.rarity = {
            operator: Operator.EXACT,
            value: [Rarity.UNIQUE],
          };
        }
        if (!enabled) {
          // TODO: check if rarity condition still needs to exist
        }
      }
      if (node.data.itemClass === "Pinnacle Keys") {
        if (
          enabled &&
          !props.rule.conditions.classes?.value.includes("Pinnacle Keys")
        ) {
          toast.info("Adding 'Pinnacle Keys' class condition to rule.", {
            description:
              "Pinnacle Keys are not filterable by base type and must be filtered by class.",
          });
          props.rule.conditions.classes = {
            operator: Operator.EXACT,
            value: ["Pinnacle Keys"],
          };
        }
        if (!enabled) {
          // TODO: check if classes condition still needs to exist
        }
      }

      const ruleHasBase = props.rule.bases.some(
        (base) => base.name === node.name,
      );
      if (!ruleHasBase && enabled) {
        props.rule.bases.push({
          name: node.data.name,
          base: node.data.base,
          category: node.data.category,
          enabled,
        });
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
