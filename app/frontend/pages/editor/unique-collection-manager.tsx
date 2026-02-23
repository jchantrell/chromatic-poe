import Tooltip from "@app/components/tooltip";
import { RefreshIcon } from "@app/icons";
import {
  refreshUniqueCollectionBases,
  setUniqueCollectionDisplay,
  setUniqueCollectionLeague,
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
import { Label } from "@app/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";
import { createSignal, onMount, Show } from "solid-js";
import { toast } from "solid-sonner";

/**
 * Manages the unique-collection rule's league selection and refresh.
 * Replaces the ConditionManager for unique-collection rules.
 */
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

  async function handleLeagueChange(value: string | null) {
    if (!value || !store.filter) return;
    setUniqueCollectionLeague(store.filter, props.rule, value);
  }

  function handleDisplayChange(value: UniqueCollectionDisplay) {
    if (!store.filter) return;
    setUniqueCollectionDisplay(store.filter, props.rule, value);
  }

  async function handleRefresh() {
    const username = chromatic.config?.poeladderUsername;
    if (!username) {
      toast.error("PoE Ladder username not set", {
        description: "Set your PoE Ladder username in settings.",
      });
      return;
    }

    const league = props.rule.uniqueCollection.league;
    if (!league) {
      toast.error("No league selected", {
        description: "Select a league before refreshing.",
      });
      return;
    }

    if (!store.filter) return;

    setRefreshing(true);
    const uniques = await fetchMissingUniques(
      username,
      league,
      props.rule.uniqueCollection.display,
    );
    if (uniques.length > 0) {
      refreshUniqueCollectionBases(store.filter, props.rule, uniques);
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
    const iso = props.rule.uniqueCollection.lastRefreshed;
    if (!iso) return "Never";
    const date = new Date(iso);
    return date.toLocaleString();
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
