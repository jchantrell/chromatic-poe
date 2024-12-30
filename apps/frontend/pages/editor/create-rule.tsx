import { createRule, type FilterRule } from "@app/lib/filter";
import { ulid } from "ulid";
import { store } from "@app/store";
import { clone } from "@pkgs/lib/utils";
import { Button } from "@pkgs/ui/button";

function CreateRule(props: { parent?: FilterRule }) {
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
      actions: props.parent
        ? clone(props.parent.actions)
        : {
            text: { r: 255, g: 255, b: 255, a: 255 },
            border: { r: 255, g: 255, b: 255, a: 255 },
            background: { r: 19, g: 14, b: 6, a: 255 },
          },
    };
    createRule(store.filter, rule);
  }

  return (
    <Button onClick={() => handleCreate()} variant='secondary'>
      +
    </Button>
  );
}

export default CreateRule;
