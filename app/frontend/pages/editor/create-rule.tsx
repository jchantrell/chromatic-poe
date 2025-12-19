import { DEFAULT_STYLE } from "@app/lib/action";
import { createRule } from "@app/lib/commands";
import type { FilterRule } from "@app/lib/filter";
import { clone } from "@app/lib/utils";
import { store } from "@app/store";
import { Button } from "@app/ui/button";
import { ulid } from "ulid";

function CreateRule() {
  async function handleCreate() {
    if (!store.filter) {
      return;
    }

    const rule: FilterRule = {
      id: ulid(),
      name: "New rule",
      show: true,
      enabled: true,
      bases: [],
      conditions: [],
      actions: clone(DEFAULT_STYLE),
      continue: false,
    };
    createRule(store.filter, rule);
  }

  return (
    <Button class='text-2xl' onClick={() => handleCreate()} variant='secondary'>
      +
    </Button>
  );
}

export default CreateRule;
