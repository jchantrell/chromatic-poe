import { createRule, type FilterRule } from "@app/lib/filter";
import { ulid } from "ulid";
import { store } from "@app/store";
import { Button } from "@pkgs/ui/button";
import { clone } from "@pkgs/lib/utils";
import { DEFAULT_STYLE } from "@app/lib/filter";

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
