import { createRule } from "@app/lib/commands";
import type { FilterRule } from "@app/lib/filter";
import { store } from "@app/store";
import { Button } from "@app/ui/button";
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
    createRule(store.filter, rule, store.activeRule);
  }

  return (
    <Button
      class='text-2xl border border-accent rounded-none w-full'
      onClick={() => handleCreate()}
      variant='secondary'
    >
      +
    </Button>
  );
}

export default CreateRule;
