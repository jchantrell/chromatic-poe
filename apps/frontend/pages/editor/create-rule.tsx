import { createRule, type FilterRule } from "@app/lib/filter";
import { ulid } from "ulid";
import { store } from "@app/store";
import { Button } from "@pkgs/ui/button";
import { clone } from "@pkgs/lib/utils";

const DEFAULT_STYLE = {
  text: { r: 255, g: 255, b: 255, a: 255 },
  border: { r: 19, g: 14, b: 6, a: 255 },
  background: { r: 19, g: 14, b: 6, a: 255 },
};

function CreateRule() {
  async function handleCreate() {
    if (!store.filter) {
      return;
    }

    const rule: FilterRule = {
      id: ulid(),
      name: "New rule",
      show: true,
      icon: null,
      enabled: true,
      bases: [],
      conditions: {},
      actions: clone(DEFAULT_STYLE),
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
