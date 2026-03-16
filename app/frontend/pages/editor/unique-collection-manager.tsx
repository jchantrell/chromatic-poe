import Tooltip from "@app/components/tooltip";
import { RefreshIcon } from "@app/icons";
import {
  refreshUniqueCollectionBases,
  setUniqueCollectionDisplay,
  setUniqueCollectionLeague,
  setUniqueCollectionSelectedLeagues,
} from "@app/lib/commands";
import chromatic from "@app/lib/config";
import type {
  UniqueCollectionDisplay,
  UniqueCollectionRule,
} from "@app/lib/filter";
import {
  fetchLeagues,
  fetchMissingUniques,
  leagueSlugFromUrl,
  type PoeladderLeague,
} from "@app/lib/poeladder";
import { store } from "@app/store";
import { Button } from "@app/ui/button";
import * as CheckboxPrimitive from "@kobalte/core/checkbox";
import { Label } from "@app/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";
import { createMemo, createSignal, For, onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

export default function UniqueCollectionManager(props: {
  rule: UniqueCollectionRule;
}) {
  const [leagues, setLeagues] = createSignal<PoeladderLeague[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [refreshing, setRefreshing] = createSignal(false);

  onMount(async () => {
    const username = chromatic.config?.poeladderUsername;
    if (!username) {
      toast.error("PoE Ladder username not set", {
        description: "Set your PoE Ladder username in settings.",
      });
      return;
    }
    setLoading(true);
    const result = await fetchLeagues(username);
    setLeagues(result);
    setLoading(false);
  });

  const cachedUniques = createMemo(() => {
    const leagueSlug = props.rule.uniqueCollection.league;
    if (!leagueSlug) return [];
    return store.missingUniques[leagueSlug]?.uniques ?? [];
  });

  const availableLeagues = createMemo(() => {
    const leagues = new Set(cachedUniques().map((u) => u.league));
    return Array.from(leagues).sort();
  });

  const lastRefreshed = createMemo(() => {
    const leagueSlug = props.rule.uniqueCollection.league;
    if (!leagueSlug) return undefined;
    return store.missingUniques[leagueSlug]?.lastRefreshed;
  });

  async function handleLeagueChange(value: string | null) {
    if (!value || !store.filter) return;
    setUniqueCollectionLeague(store.filter, props.rule, value);
  }

  function handleDisplayChange(value: UniqueCollectionDisplay) {
    if (!store.filter) return;
    setUniqueCollectionDisplay(store.filter, props.rule, value);
  }

  function handleLeagueToggle(league: string, checked: boolean) {
    if (!store.filter) return;
    const current = props.rule.uniqueCollection.selectedLeagues;
    const next = checked
      ? [...current, league]
      : current.filter((l) => l !== league);
    setUniqueCollectionSelectedLeagues(
      store.filter,
      props.rule,
      next,
      cachedUniques(),
    );
  }

  function handleSelectAll() {
    if (!store.filter) return;
    setUniqueCollectionSelectedLeagues(
      store.filter,
      props.rule,
      availableLeagues(),
      cachedUniques(),
    );
  }

  function handleSelectNone() {
    if (!store.filter) return;
    setUniqueCollectionSelectedLeagues(
      store.filter,
      props.rule,
      [],
      cachedUniques(),
    );
  }

  async function handleRefresh() {
    const username = chromatic.config?.poeladderUsername;
    if (!username) {
      toast.error("PoE Ladder username not set", {
        description: "Set your PoE Ladder username in settings.",
      });
      return;
    }

    const leagueSlug = props.rule.uniqueCollection.league;
    if (!leagueSlug) {
      toast.error("No league selected", {
        description: "Select a league before refreshing.",
      });
      return;
    }

    if (!store.filter) return;

    setRefreshing(true);
    const uniques = await fetchMissingUniques(
      username,
      leagueSlug,
      props.rule.uniqueCollection.display,
    );

    const cache = await chromatic.saveMissingUniques(leagueSlug, uniques);
    store.missingUniques[leagueSlug] = cache;

    if (uniques.length > 0) {
      refreshUniqueCollectionBases(store.filter, uniques);

      const newLeagues = Array.from(
        new Set(uniques.map((u) => u.league)),
      ).sort();
      for (const rule of store.filter.rules) {
        if (rule.type !== "unique-collection") continue;
        if (rule.uniqueCollection.league !== leagueSlug) continue;
        if (rule.uniqueCollection.selectedLeagues.length === 0) {
          setUniqueCollectionSelectedLeagues(
            store.filter,
            rule,
            newLeagues,
            uniques,
          );
        }
      }

      toast.success(
        `Updated with ${uniques.length} missing unique${uniques.length === 1 ? "" : "s"}`,
      );
    } else {
      toast.info("No missing uniques found for this league");
    }
    setRefreshing(false);
  }

  function leagueOptions(): string[] {
    return leagues().map((l) => leagueSlugFromUrl(l.url));
  }

  function leagueDisplayName(slug: string): string {
    const league = leagues().find((l) => leagueSlugFromUrl(l.url) === slug);
    return league?.name ?? slug.replace(/_/g, " ");
  }

  function formatLastRefreshed(): string {
    const iso = lastRefreshed();
    if (!iso) return "Never";
    return new Date(iso).toLocaleString();
  }

  return (
    <div class='space-y-2 flex flex-col w-full flex-1 min-h-0 overflow-hidden'>
      <div class='flex flex-col gap-3 w-full bg-primary-foreground/20 border border-accent rounded-xl px-3 py-2'>
        <div class='flex items-center gap-2'>
          <Label class='text-md font-semibold shrink-0'>League</Label>
          <Show
            when={!loading()}
            fallback={
              <span class='text-sm text-muted-foreground'>
                Loading leagues...
              </span>
            }
          >
            <Select
              value={props.rule.uniqueCollection.league}
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

        <div class='flex items-center gap-2'>
          <Label class='text-md font-semibold shrink-0'>Mode</Label>
          <div class='flex rounded-md overflow-hidden border border-accent'>
            <button
              type='button'
              class={`px-3 py-1 text-xs cursor-pointer transition-colors ${
                props.rule.uniqueCollection.display === "league"
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
                props.rule.uniqueCollection.display === "combined"
                  ? "bg-accent text-accent-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => handleDisplayChange("combined")}
            >
              Full collection
            </button>
          </div>
        </div>

        <div class='flex items-center justify-between'>
          <div class='flex flex-col gap-0.5'>
            <span class='text-xs text-muted-foreground'>
              Last refreshed: {formatLastRefreshed()}
            </span>
            <span class='text-xs text-muted-foreground'>
              {props.rule.bases.length} missing unique
              {props.rule.bases.length === 1 ? "" : "s"}
            </span>
          </div>
          <Tooltip text='Refresh missing uniques from PoE Ladder'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={refreshing() || !props.rule.uniqueCollection.league}
              class='gap-1'
            >
              <span class={refreshing() ? "animate-spin" : ""}>
                <RefreshIcon />
              </span>
              Refresh
            </Button>
          </Tooltip>
        </div>
      </div>

      <Show when={availableLeagues().length > 0}>
        <div class='flex flex-col gap-1 bg-primary-foreground/20 border border-accent rounded-xl px-3 py-2'>
          <div class='flex items-center justify-between'>
            <Label class='text-sm font-semibold text-muted-foreground'>
              Filter by League
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
          <div class='flex flex-wrap gap-x-3 gap-y-1'>
            <For each={availableLeagues()}>
              {(league) => (
                <CheckboxPrimitive.Root
                  class='flex items-center gap-1.5 text-sm cursor-pointer'
                  checked={props.rule.uniqueCollection.selectedLeagues.includes(
                    league,
                  )}
                  onChange={(checked: boolean) =>
                    handleLeagueToggle(league, checked)
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
                    {league}
                  </CheckboxPrimitive.Label>
                </CheckboxPrimitive.Root>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={props.rule.bases.length > 0}>
        <div class='space-y-1 pb-2 pr-1 flex flex-col overflow-y-auto overflow-x-hidden w-full flex-1 min-h-0 scrollbar-thumb-neutral-600'>
          <Label class='text-sm font-semibold text-muted-foreground px-1'>
            Missing Uniques
          </Label>
          {props.rule.bases.map((item) => (
            <div class='bg-primary-foreground border border-accent rounded-lg flex items-center px-3 py-1.5 w-full'>
              <div class='flex flex-col min-w-0'>
                <span class='text-sm font-medium truncate'>{item.name}</span>
                <span class='text-xs text-muted-foreground truncate'>
                  {item.base} — {item.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Show>

      <Show when={props.rule.bases.length === 0}>
        <div class='text-center py-8 text-muted-foreground'>
          {props.rule.uniqueCollection.league
            ? "No missing uniques loaded. Click Refresh to fetch from PoE Ladder."
            : "Select a league and click Refresh to load missing uniques."}
        </div>
      </Show>
    </div>
  );
}
