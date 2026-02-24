import { createRule, createUniqueCollectionRule } from "@app/lib/commands";
import chromatic from "@app/lib/config";
import type { FilterRule } from "@app/lib/filter";
import { setActiveRule, store } from "@app/store";
import { Button } from "@app/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@app/ui/context-menu";
import { toast } from "solid-sonner";
import { ulid } from "ulid";

function CreateRule() {
  function handleCreate() {
    if (!store.filter) {
      return;
    }

    const rule: FilterRule = {
      type: "standard",
      id: ulid(),
      name: "New rule",
      show: true,
      enabled: true,
      bases: [],
      conditions: [],
      actions: {},
      continue: false,
    };
    createRule(store.filter, rule);
  }

  function handleCreateUniqueCollection() {
    if (!store.filter) {
      return;
    }

    const username = chromatic.config?.poeladderUsername;
    if (!username) {
      toast.error("PoE Ladder username not set", {
        description: "Set your PoE Ladder username in settings first.",
      });
      return;
    }

    const rule = createUniqueCollectionRule(store.filter, "");
    setActiveRule(rule);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        as={Button<"button">}
        class='text-2xl border border-accent rounded-none w-full'
        onClick={() => handleCreate()}
        variant='secondary'
      >
        +
      </ContextMenuTrigger>
      <ContextMenuContent class='w-56'>
        <ContextMenuItem onMouseDown={() => handleCreate()}>
          New Rule
        </ContextMenuItem>
        <ContextMenuItem onMouseDown={() => handleCreateUniqueCollection()}>
          New Unique Collection Rule
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default CreateRule;
