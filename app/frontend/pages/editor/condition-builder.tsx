import Tooltip from "@app/components/tooltip";
import { CloseIcon, PlusIcon, RefreshIcon } from "@app/icons";
import { excuteCmd, removeCondition } from "@app/lib/commands";
import {
  ConditionGroup,
  conditionGroupColors,
  ConditionKey,
  conditionTypes,
  createCondition,
  MissingUniquesCondition,
  Operator,
  type Conditions,
  UniqueTiersCondition,
} from "@app/lib/condition";
import type { FilterRule } from "@app/lib/filter";
import type { PoeladderUnique } from "@app/lib/poeladder";
import {
  fetchAllUniques,
  fetchLeagues,
  fetchMissingUniques,
  leagueSlugFromUrl,
  type PoeladderLeague,
} from "@app/lib/poeladder";
import chromatic from "@app/lib/config";
import { enchantIndex, modIndex } from "@app/lib/mods";
import { store } from "@app/store";
import { Button } from "@app/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@app/ui/dialog";
import { Label } from "@app/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";
import { Separator } from "@app/ui/separator";
import { Switch, SwitchControl, SwitchThumb } from "@app/ui/switch";
import { TextField, TextFieldInput } from "@app/ui/text-field";
import * as CheckboxPrimitive from "@kobalte/core/checkbox";
import Fuse from "fuse.js";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onMount,
  Show,
} from "solid-js";
import {
  CheckboxInput,
  SelectInput,
  SliderInput,
  SocketInput,
  ToggleInput,
} from "./condition-inputs";
import { ItemPicker } from "./item-picker";

const options = {
  keys: ["label", "group", "description", "options"],
  useExtendedSearch: true,
  ignoreFieldNorm: true,
  minMatchCharLength: 1,
  distance: 160,
  threshold: 0.6,
};

type FilteredConditionKey = Exclude<ConditionKey, ConditionKey.BASE_TYPE>;

const UNIQUE_CONDITION_KEYS = new Set([
  ConditionKey.UNIQUE_TIERS,
  ConditionKey.MISSING_UNIQUES,
]);

function hasUniqueCondition(rule: FilterRule): boolean {
  return rule.conditions.some((c) => UNIQUE_CONDITION_KEYS.has(c.key));
}

function getUniquesForCondition(
  condition: UniqueTiersCondition | MissingUniquesCondition,
): PoeladderUnique[] {
  const slug = condition.leagueSlug;
  if (!slug) return [];
  if (condition.key === ConditionKey.MISSING_UNIQUES) {
    return store.missingUniques[slug]?.uniques ?? [];
  }
  return store.allUniques[slug]?.uniques ?? [];
}

function deriveBasesFromUniques(
  uniques: PoeladderUnique[],
  selectedCategories: string[],
): { name: string; enabled: boolean; base: string; category: string }[] {
  if (selectedCategories.length === 0) return [];
  const selected = new Set(selectedCategories);
  return uniques
    .filter(
      (u) => (u.league && selected.has(u.league)) || selected.has(u.category),
    )
    .map((u) => ({
      name: u.name,
      enabled: true,
      base: u.base,
      category: u.grouping,
    }));
}

function CategoriesInput(props: {
  condition: UniqueTiersCondition | MissingUniquesCondition;
  rule: FilterRule;
  onChange: (key: string, value: unknown) => void;
}) {
  const [leagues, setLeagues] = createSignal<PoeladderLeague[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [refreshing, setRefreshing] = createSignal(false);

  const isMissing = () => props.condition.key === ConditionKey.MISSING_UNIQUES;

  onMount(async () => {
    const username = chromatic.config?.poeladderUsername;
    if (!username) return;
    setLoading(true);
    setLeagues(await fetchLeagues(username));

    const slug = props.condition.leagueSlug;
    if (slug) await ensureCached(slug);
    setLoading(false);
  });

  async function ensureCached(slug: string) {
    if (isMissing()) {
      if (!store.missingUniques[slug]) {
        await handleRefresh(slug);
      }
    } else {
      if (!store.allUniques[slug]) {
        const uniques = await fetchAllUniques(slug);
        if (uniques.length > 0) {
          const cache = await chromatic.saveAllUniques(slug, uniques);
          store.allUniques[slug] = cache;
        }
      }
    }
  }

  const cachedUniques = createMemo(() =>
    getUniquesForCondition(props.condition),
  );

  const availableLeagues = createMemo(() => {
    const leagues = new Set<string>();
    for (const u of cachedUniques()) {
      if (u.league) leagues.add(u.league);
    }
    return Array.from(leagues).sort();
  });

  const availableCategories = createMemo(() => {
    const cats = new Set<string>();
    for (const u of cachedUniques()) {
      if (u.category) cats.add(u.category);
    }
    return Array.from(cats).sort();
  });

  function updateBases(categories: string[]) {
    if (!store.filter) return;
    const uniques = cachedUniques();
    const bases = deriveBasesFromUniques(uniques, categories);
    excuteCmd(store.filter, () => {
      props.rule.bases = bases;
    });
  }

  async function handleLeagueChange(value: string | null) {
    if (!value) return;
    props.onChange("leagueSlug", value);

    setLoading(true);
    await ensureCached(value);
    setLoading(false);

    const uniques = getUniquesForCondition({
      ...props.condition,
      leagueSlug: value,
    } as any);
    if (uniques.length > 0 && props.condition.value.length === 0) {
      const leagues = new Set<string>();
      const cats = new Set<string>();
      for (const u of uniques) {
        if (u.league) leagues.add(u.league);
        if (u.category) cats.add(u.category);
      }
      const all = [...Array.from(leagues).sort(), ...Array.from(cats).sort()];
      props.onChange("value", all);
      updateBases(all);
    }
  }

  function handleToggle(category: string, checked: boolean) {
    const current = props.condition.value;
    const next = checked
      ? [...current, category]
      : current.filter((c) => c !== category);
    props.onChange("value", next);
    updateBases(next);
  }

  function handleSelectAll() {
    const all = [...availableLeagues(), ...availableCategories()];
    props.onChange("value", all);
    updateBases(all);
  }

  function handleSelectNone() {
    props.onChange("value", []);
    updateBases([]);
  }

  async function handleRefresh(slug?: string) {
    const leagueSlug = slug ?? props.condition.leagueSlug;
    if (!leagueSlug) return;
    const username = chromatic.config?.poeladderUsername;
    if (!username) return;

    setRefreshing(true);
    if (isMissing()) {
      const cond = props.condition as MissingUniquesCondition;
      const uniques = await fetchMissingUniques(
        username,
        leagueSlug,
        cond.display,
      );
      const cache = await chromatic.saveMissingUniques(leagueSlug, uniques);
      store.missingUniques[leagueSlug] = cache;
    }

    const allUniquesList = await fetchAllUniques(leagueSlug);
    if (allUniquesList.length > 0) {
      const cache = await chromatic.saveAllUniques(leagueSlug, allUniquesList);
      store.allUniques[leagueSlug] = cache;
    }

    if (props.condition.value.length > 0) {
      updateBases(props.condition.value);
    }
    setRefreshing(false);
  }

  function handleDisplayChange(display: "league" | "combined") {
    props.onChange("display", display);
  }

  function leagueOptions(): string[] {
    return leagues().map((l) => leagueSlugFromUrl(l.url));
  }

  function leagueDisplayName(slug: string): string {
    const league = leagues().find((l) => leagueSlugFromUrl(l.url) === slug);
    return league?.name ?? slug.replace(/_/g, " ");
  }

  return (
    <div class='flex flex-col gap-2 w-full'>
      <div class='flex items-center gap-2'>
        <Label class='text-sm font-semibold shrink-0'>League</Label>
        <Show
          when={!loading()}
          fallback={
            <span class='text-xs text-muted-foreground'>Loading...</span>
          }
        >
          <Select
            value={props.condition.leagueSlug}
            onChange={handleLeagueChange}
            options={leagueOptions()}
            itemComponent={(itemProps) => (
              <SelectItem item={itemProps.item}>
                {leagueDisplayName(itemProps.item.rawValue)}
              </SelectItem>
            )}
          >
            <SelectTrigger class='flex-1 bg-accent'>
              <SelectValue<string>>
                {(state) =>
                  state.selectedOption()
                    ? leagueDisplayName(state.selectedOption())
                    : "Select a league"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </Show>
      </div>

      <Show when={isMissing()}>
        <div class='flex items-center gap-2'>
          <Label class='text-sm font-semibold shrink-0'>Mode</Label>
          <div class='flex rounded-md overflow-hidden border border-accent'>
            <button
              type='button'
              class={`px-3 py-1 text-xs cursor-pointer transition-colors ${
                (props.condition as MissingUniquesCondition).display ===
                "league"
                  ? "bg-accent text-accent-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => handleDisplayChange("league")}
            >
              League only
            </button>
            <button
              type='button'
              class={`px-3 py-1 text-xs cursor-pointer transition-colors ${
                (props.condition as MissingUniquesCondition).display ===
                "combined"
                  ? "bg-accent text-accent-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => handleDisplayChange("combined")}
            >
              Full collection
            </button>
          </div>
        </div>
      </Show>

      <div class='flex items-center justify-between'>
        <span class='text-xs text-muted-foreground'>
          {props.rule.bases.length} unique
          {props.rule.bases.length === 1 ? "" : "s"}
        </span>
        <Button
          variant='outline'
          size='sm'
          onClick={() => handleRefresh()}
          disabled={refreshing() || !props.condition.leagueSlug}
          class='gap-1'
        >
          <span class={refreshing() ? "animate-spin" : ""}>
            <RefreshIcon />
          </span>
          Refresh
        </Button>
      </div>

      <Show
        when={availableLeagues().length > 0 || availableCategories().length > 0}
      >
        <div class='flex items-center justify-between'>
          <Label class='text-sm font-semibold text-muted-foreground'>
            Filters
          </Label>
          <div class='flex gap-2'>
            <button
              type='button'
              class='text-xs text-muted-foreground hover:text-foreground cursor-pointer'
              onClick={handleSelectAll}
            >
              All
            </button>
            <button
              type='button'
              class='text-xs text-muted-foreground hover:text-foreground cursor-pointer'
              onClick={handleSelectNone}
            >
              None
            </button>
          </div>
        </div>

        <Show when={availableLeagues().length > 0}>
          <Label class='text-xs text-muted-foreground'>Leagues</Label>
          <div class='flex flex-wrap gap-x-3 gap-y-1'>
            <For each={availableLeagues()}>
              {(league) => (
                <CheckboxPrimitive.Root
                  class='flex items-center gap-1.5 text-sm cursor-pointer'
                  checked={props.condition.value.includes(league)}
                  onChange={(checked: boolean) => handleToggle(league, checked)}
                >
                  <CheckboxPrimitive.Input class='peer' />
                  <CheckboxPrimitive.Control class='size-4 shrink-0 rounded-sm border border-primary ring-offset-background data-checked:border-none data-checked:bg-primary data-checked:text-primary-foreground cursor-pointer'>
                    <CheckboxPrimitive.Indicator>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        stroke-width='2'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                        class='size-4'
                      >
                        <path d='M5 12l5 5l10 -10' />
                      </svg>
                    </CheckboxPrimitive.Indicator>
                  </CheckboxPrimitive.Control>
                  <CheckboxPrimitive.Label class='cursor-pointer select-none'>
                    {league}
                  </CheckboxPrimitive.Label>
                </CheckboxPrimitive.Root>
              )}
            </For>
          </div>
        </Show>

        <Show when={availableCategories().length > 0}>
          <Label class='text-xs text-muted-foreground'>Categories</Label>
          <div class='flex flex-wrap gap-x-3 gap-y-1'>
            <For each={availableCategories()}>
              {(category) => (
                <CheckboxPrimitive.Root
                  class='flex items-center gap-1.5 text-sm cursor-pointer'
                  checked={props.condition.value.includes(category)}
                  onChange={(checked: boolean) =>
                    handleToggle(category, checked)
                  }
                >
                  <CheckboxPrimitive.Input class='peer' />
                  <CheckboxPrimitive.Control class='size-4 shrink-0 rounded-sm border border-primary ring-offset-background data-checked:border-none data-checked:bg-primary data-checked:text-primary-foreground cursor-pointer'>
                    <CheckboxPrimitive.Indicator>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        stroke-width='2'
                        stroke-linecap='round'
                        stroke-linejoin='round'
                        class='size-4'
                      >
                        <path d='M5 12l5 5l10 -10' />
                      </svg>
                    </CheckboxPrimitive.Indicator>
                  </CheckboxPrimitive.Control>
                  <CheckboxPrimitive.Label class='cursor-pointer select-none'>
                    {category}
                  </CheckboxPrimitive.Label>
                </CheckboxPrimitive.Root>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

const operators = [
  Operator.NONE,
  Operator.GTE,
  Operator.LTE,
  Operator.EXACT,
  Operator.GT,
  Operator.LT,
];

export default function ConditionManager(props: { rule: FilterRule }) {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filteredConditionGroups, setFilteredConditionGroups] = createSignal<
    ConditionGroup[]
  >([]);

  const searchIndex = createMemo(() => {
    return new Fuse(
      Object.entries(conditionTypes)
        .filter(([_, condition]) => {
          if (!store.filter) return true;
          return (
            store.filter.poeVersion === condition.validFor ||
            !condition.validFor
          );
        })
        .map(([key, value]) => ({
          key: key as ConditionKey,
          ...value,
        })) || [],
      options,
    );
  });

  const filteredConditions = createMemo(() => {
    const results = searchIndex()
      .search(
        searchTerm() !== "" ? `'${searchTerm()}` : { label: "!1234567890" },
      )
      .map((result) => result.item);

    const ruleHasUnique = hasUniqueCondition(props.rule);
    const ruleHasOther = props.rule.conditions.some(
      (c) => !UNIQUE_CONDITION_KEYS.has(c.key),
    );

    return results.filter((c) => {
      const isUnique = UNIQUE_CONDITION_KEYS.has(c.key as ConditionKey);
      if (ruleHasUnique && !isUnique) return false;
      if (ruleHasUnique && isUnique) return false;
      if (ruleHasOther && isUnique) return false;
      return true;
    });
  });

  function addCondition(condition: ConditionKey) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        props.rule.conditions.push(createCondition(condition));
      });
    }
  }

  function updateCondition<T extends Conditions, K extends keyof T>(
    condition: T,
    key: K,
    value: T[K],
  ) {
    if (store.filter) {
      excuteCmd(store.filter, () => {
        condition[key] = value;
      });
    }
  }

  function handleRemoveCondition<T extends Conditions>(condition: T) {
    if (store.filter) {
      removeCondition(store.filter, props.rule, condition);
    }
  }

  function toggleHidden(checked: boolean) {
    if (store.filter && props.rule) {
      excuteCmd(store.filter, () => {
        props.rule.show = checked;
      });
    }
  }

  function toggleContinue(checked: boolean) {
    if (store.filter && props.rule) {
      excuteCmd(store.filter, () => {
        if (props.rule.continue !== checked) {
          props.rule.continue = checked;
        }
      });
    }
  }

  function getConditionCount(key: ConditionKey) {
    const count = props.rule.conditions.filter((c) => c.key === key).length;
    return count ? `(${count})` : "";
  }

  function getIndex(key: ConditionKey) {
    switch (key) {
      case ConditionKey.EXPLICIT_MOD:
        return modIndex;
      case ConditionKey.ENCHANTMENT:
        return enchantIndex;
      default:
        throw new Error("Unspported condition key");
    }
  }

  function getGroupKey(key: ConditionKey) {
    switch (key) {
      case ConditionKey.EXPLICIT_MOD:
        return "type";
      case ConditionKey.ENCHANTMENT:
        return "type";
      default:
        throw new Error("Unspported condition key");
    }
  }

  createEffect(() => {
    setFilteredConditionGroups(
      Array.from(
        new Set(
          filteredConditions()
            .filter((condition) => condition.group !== ConditionGroup.UNUSED)
            .map((condition) => condition.group),
        ),
      ),
    );
  });

  return (
    <div class='space-y-2 flex flex-col w-full flex-1 min-h-0 overflow-hidden'>
      <div class='flex flex-wrap gap-3 items-center w-full bg-primary-foreground/20 border border-accent rounded-xl px-2 py-1'>
        <Dialog>
          <DialogTrigger
            class='text-md font-semibold'
            as={Button<"button">}
            disabled={hasUniqueCondition(props.rule)}
          >
            Edit Items
          </DialogTrigger>
          <DialogContent class='sm:max-w-[600px] overflow-y-visible'>
            <ItemPicker rule={props.rule} />
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger
            class='text-md font-semibold'
            as={Button<"button">}
            disabled={hasUniqueCondition(props.rule)}
          >
            Add Conditions
          </DialogTrigger>
          <DialogContent class='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>Add Conditions to {props.rule?.name}</DialogTitle>
            </DialogHeader>
            <div class='py-2'>
              <TextField value={searchTerm()} onChange={setSearchTerm}>
                <TextFieldInput
                  type='text'
                  placeholder='Search for conditions...'
                />
              </TextField>
            </div>
            <div class='overflow-y-auto h-[50vh]'>
              <For each={filteredConditionGroups()}>
                {(group) => {
                  if (
                    !filteredConditions().some(
                      (condition) => condition.group === group,
                    )
                  ) {
                    return "";
                  }
                  return (
                    <div class='flex flex-col gap-1 mb-2'>
                      <Label
                        class={`text-md h-4 mb-1 ${conditionGroupColors[group as keyof typeof conditionGroupColors]}`}
                      >
                        {group}
                      </Label>
                      <Separator />
                      <For
                        each={filteredConditions().filter(
                          (condition) => condition.group === group,
                        )}
                      >
                        {(condition) => (
                          <div class='flex gap-2 items-center ml-1'>
                            <Button
                              onClick={() =>
                                addCondition(condition.key as ConditionKey)
                              }
                              size='sm'
                              variant='secondary'
                            >
                              <PlusIcon />
                            </Button>
                            <div class='flex flex-col'>
                              <span class='text-md'>
                                {condition.label}
                                <span class='text-sm text-accent-foreground'>
                                  {" "}
                                  {getConditionCount(condition.key)}
                                </span>
                              </span>
                              <span class='text-xs text-muted-foreground'>
                                {condition.description}
                              </span>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  );
                }}
              </For>
            </div>
          </DialogContent>
        </Dialog>
        <div class='grid grid-rows-2 gap-1'>
          <Tooltip text='Show or Hide'>
            <div class='flex items-center gap-1 justify-between'>
              <Label class='text-md font-semibold mr-5'>Show</Label>
              <Switch
                checked={props.rule?.show}
                onChange={(checked) => {
                  toggleHidden(checked);
                }}
                class='flex items-center'
              >
                <SwitchControl class='bg-accent'>
                  <SwitchThumb />
                </SwitchControl>
              </Switch>
            </div>
          </Tooltip>
          <Tooltip text='Continue to the next rule after this one'>
            <div class='flex items-center gap-1 justify-between'>
              <Label class='text-md font-semibold'>Continue</Label>
              <Switch
                checked={props.rule?.continue}
                onChange={(checked) => {
                  toggleContinue(checked);
                }}
                class='flex items-center'
              >
                <SwitchControl class='bg-accent'>
                  <SwitchThumb />
                </SwitchControl>
              </Switch>
            </div>
          </Tooltip>
        </div>
      </div>

      {props.rule && !props.rule.conditions.length ? (
        <div class='text-center py-8 text-muted-foreground'>No conditions.</div>
      ) : (
        <div class='space-y-2 pb-2 pr-1 flex flex-col items-start overflow-y-auto overflow-x-hidden w-full flex-1 min-h-0 scrollbar-thumb-neutral-600'>
          {props.rule.conditions.map((condition) => {
            const conditionType = conditionTypes[condition.key];
            if (!condition) return null;
            return (
              <div class='group relative bg-primary-foreground border border-accent rounded-xl flex flex-wrap items-center px-2 w-full @container'>
                <button
                  type='button'
                  class='absolute top-1 right-1 size-5 p-0.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity cursor-pointer'
                  onClick={() => handleRemoveCondition(condition)}
                  aria-label={`Remove ${conditionType.label}`}
                >
                  <CloseIcon />
                </button>
                <div class='max-w-full w-full px-2 pt-1'>
                  <Label class='text-md font-bold'>{conditionType.label}</Label>
                </div>
                <div class='flex gap-1 p-2'>
                  {"operator" in condition &&
                    condition.operator !== undefined && (
                      <Select
                        class='mr-1'
                        value={condition.operator}
                        onChange={(value) => {
                          if (value) {
                            updateCondition(condition, "operator", value);
                          }
                        }}
                        options={operators}
                        itemComponent={(props) => (
                          <SelectItem item={props.item}>
                            {props.item.rawValue === ""
                              ? "None"
                              : props.item.rawValue}
                          </SelectItem>
                        )}
                      >
                        <SelectTrigger class='w-17.5 bg-accent'>
                          <SelectValue<string>>
                            {(state) => state.selectedOption()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent />
                      </Select>
                    )}
                  {condition.key === ConditionKey.EXPLICIT_MOD && (
                    <TextField
                      class='w-20'
                      value={String((condition as any).stack ?? 1)}
                      onChange={(v) => {
                        updateCondition(condition as any, "stack", Number(v));
                      }}
                    >
                      <TextFieldInput type='number' />
                    </TextField>
                  )}
                  <div>
                    {conditionType.type === "slider" && (
                      <SliderInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as number}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "select" && (
                      <SelectInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as string[]}
                        index={getIndex(condition.key)}
                        groupKey={getGroupKey(condition.key)}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "text-list" && (
                      <ToggleInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as string[]}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "socket" && (
                      <SocketInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as string}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "checkbox" && (
                      <CheckboxInput
                        key={condition.key as FilteredConditionKey}
                        value={condition.value as boolean}
                        onChange={(v) => {
                          updateCondition(condition, "value", v);
                        }}
                      />
                    )}
                    {conditionType.type === "categories" && (
                      <CategoriesInput
                        condition={
                          condition as
                            | UniqueTiersCondition
                            | MissingUniquesCondition
                        }
                        rule={props.rule}
                        onChange={(key, value) => {
                          updateCondition(condition as any, key, value);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
