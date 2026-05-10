# Data Release Pipeline

## Problem

Chromatic-PoE currently runs the entire game data extraction pipeline on the client: downloading game bundles from PoE CDN, parsing DAT binary files with community-maintained schemas, importing into SQLite, running SQL queries, and fetching PoE Wiki / PoE Ladder APIs. This causes three problems:

1. **Silent breakage**: When the community-maintained `pathofexile-dat-schema` renames a column (e.g., `GemEffects` → `GemVariants`), the client breaks with no notification to the developer.
2. **Partial data without indication**: PoE Wiki and PoE Ladder APIs lag behind game patches. Users get incomplete unique item data with no warning.
3. **Unnecessary client complexity**: Every user re-runs the same heavy data extraction pipeline.

## Solution

Move data extraction to a GitHub Actions pipeline that publishes pre-built JSON as GitHub Release assets. Two pipelines, two release streams:

- **Patch data** (binary pass/fail): items, mods, minimap coordinates
- **Unique data** (best-effort): uniques enriched by wiki base types and poeladder categories, with nullable fields for gaps

The client downloads pre-built JSON instead of running extraction.

## Architecture

```
Scheduled GitHub Action (every 6h + manual dispatch)
  │
  ├── check-versions
  │     Poll poe-versions.obsoleet.org for current PoE1/PoE2 patch versions
  │     Check if data release already exists for each version
  │
  ├── patch-data pipeline (pass/fail)
  │     Download bundles from CDN → parse DAT files → import to SQLite → run queries
  │     Output: items.json, mods.json, minimap.json
  │     Create GitHub Release tagged data-poe{1,2}-{version}
  │     Discord webhook on FAILURE
  │
  └── unique-data pipeline (best-effort, depends on patch-data)
        Run UNIQUES_QUERY against SQLite
        Enrich with PoE Wiki base types (nullable)
        Enrich with PoE Ladder categories (nullable)
        Output: uniques.json uploaded to same release
        Discord webhook with gap details
        Re-runs on schedule to fill gaps (up to 48h after patch)
```

## Pipeline

### Directory Structure

```
pipeline/
  package.json
  tsconfig.json
  src/
    extract.ts          Main entry point
    lib/
      bundle.ts         Node.js bundle downloader (native fetch, in-memory cache)
      db.ts             better-sqlite3 wrapper (in-memory)
      dat.ts            DAT file parser (schema fetch, table import)
      wiki.ts           PoE Wiki Cargo API client
      poeladder.ts      PoE Ladder API client (fetchAllUniques only)
      minimap.ts        Minimap coordinate extraction
      mods.ts           Item mod extraction
      notify.ts         Discord webhook
      versions.ts       PoE version fetcher
```

### Shared Code

`queries.ts` and `stat-descriptions.ts` from `app/frontend/lib/` are pure string/parsing logic with no browser dependencies. The pipeline imports them directly.

### Dependencies

- `better-sqlite3` — synchronous SQLite for Node.js (replaces wa-sqlite)
- `pathofexile-dat` — DAT file binary parsing (same version as client)
- `pathofexile-dat-schema` — game data schema definitions (same version as client)
- `tsx` — run TypeScript directly

### Entry Point

```
extract.ts --game poe1|poe2|both [--force] [--uniques-only]
```

1. Fetch current PoE versions from `poe-versions.obsoleet.org`
2. For each game version:

   **Patch data** (skip if release exists and no `--force`):
   - Init BundleManager, download index bundle from CDN
   - For each table in TABLES: import DAT file into SQLite
   - Run ITEMS_QUERY → `items.json`
   - Extract mods → `mods.json`
   - Extract minimap coordinates → `minimap.json`
   - Write to `pipeline/output/`
   - On failure: Discord notification, exit 1

   **Unique data**:
   - Run UNIQUES_QUERY → base unique list from game data
   - Fetch PoE Wiki: map unique name → base type (null if missing)
   - Fetch PoE Ladder: map unique name → category/grouping (null if missing)
   - Merge into `uniques.json`
   - Discord notification with gap details

## Output Format

### items.json

```json
[{
  "name": "Vaal Regalia",
  "base": "Vaal Regalia",
  "category": "Body Armours",
  "class": "Body Armours",
  "type": "Intelligence",
  "score": 330,
  "art": "Art/2DArt/Items/Armours/BodyArmours/...",
  "height": 3,
  "width": 2,
  "itemClass": "Body Armours",
  "gemFx": null
}]
```

### uniques.json

Null fields indicate gaps. Client checks for nulls and shows warnings.

```json
[{
  "name": "Headhunter",
  "base": "Leather Belt",
  "category": "Uniques",
  "class": "Belts",
  "art": "Art/2DArt/Items/...",
  "poeladder": { "grouping": "...", "category": "Belts", "league": null }
}, {
  "name": "New Unknown Unique",
  "base": null,
  "category": "Uniques",
  "class": "Weapons",
  "art": "Art/2DArt/Items/...",
  "poeladder": null
}]
```

### mods.json

Array of `Mod` objects matching the existing `ModManager.extract()` output shape.

### minimap.json

`MinimapCoords` nested object: `[color][shape][size]` → `{x, y}`.

## GitHub Actions Workflow

### Triggers

- `schedule`: every 6 hours (`0 */6 * * *`)
- `workflow_dispatch`: manual with `game` and `force` inputs

### Jobs

1. **check-versions**: Fetch current PoE versions, check if releases exist
2. **extract-poe1**: Run patch data pipeline for PoE1 (if needed)
3. **extract-poe2**: Run patch data pipeline for PoE2 (if needed)
4. **enrich-uniques**: Run unique pipeline for all versions with releases. Also re-checks releases < 48h old for gap improvements.

### Release Tagging

- Format: `data-poe1-{version}` / `data-poe2-{version}`
- Example: `data-poe1-3.25.3`, `data-poe2-4.1.2`
- No collision with app releases (`v0.13.1` from release-please)
- Assets: `items.json`, `mods.json`, `minimap.json`, `uniques.json`
- Unique data re-uploaded with `gh release upload --clobber` as gaps fill

### Unique Retry Schedule

On each 6-hour scheduled run, the `enrich-uniques` job also checks existing releases created within the last 48 hours. If `uniques.json` has null fields, it re-runs enrichment. If gaps decrease, the asset is re-uploaded. Past 48h, retries stop.

### Notifications

Discord webhook via `DISCORD_WEBHOOK_URL` repository secret:
- **Patch failure**: `"PIPELINE FAILURE — poe1 3.25.3\n{error}\n{run link}"`
- **Unique gaps**: `"Data release — poe1 3.25.3\nItems: 4231, Uniques: 892\nMissing base types (5): Name1, Name2..."`
- **All clear**: `"Data release — poe1 3.25.3\nAll uniques fully enriched."`

### Poeladder League Slug

Set as a GitHub Actions variable `POELADDER_LEAGUE_SLUG`. Updated manually when leagues rotate (~every 3 months).

## Client Changes

### New: `app/frontend/lib/data-release.ts`

Fetches pre-built JSON from GitHub Release download URLs:
```
https://github.com/jchantrell/chromatic-poe/releases/download/data-poe{1,2}-{version}/{asset}.json
```

Fetches items, mods, minimap, uniques in parallel. Uniques fetch catches errors (release may not have uniques yet).

### Modified: Editor (`app/frontend/pages/editor/index.tsx`)

Replace `dat.extract()` + `dat.load()` with `fetchDataRelease(patch)`. Fall back to client-side extraction during transition. Show warning toast for uniques with null base types.

### Modified: Filter import (`app/frontend/lib/filter.ts`)

Same replacement of `dat.extract()` + `dat.load()` in the import path.

### Modified: DatManager (`app/frontend/lib/dat.ts`)

Slimmed down. Keep: `fetchPoeVersions()`, `getArt()`, `BundleManager` (for art), `ArtManager`. Remove: `extract()`, `importTable()`, `importSchema()`, `getItems()`, `getMods()`, wiki dependency.

### Warning UI

When `uniques.json` has entries with `base: null`:
> "Could not retrieve base types for {n} uniques. Cannot filter by base type for: {list}. Be careful!"

## Migration Strategy

### Phase 1: Pipeline only
- Implement pipeline, deploy workflow
- Verify output matches client extraction
- No client changes yet

### Phase 2: Client switches over
- Add `data-release.ts`
- Editor tries data release first, falls back to client extraction
- Keep fallback during transition

### Phase 3: Remove client extraction
- Remove `extract()`, `importTable()`, wa-sqlite data queries from client
- Remove `wa-sqlite` and `pathofexile-dat-schema` from root `package.json`
- Keep `pathofexile-dat` (still needed for art bundle decompression)
- Fallback becomes error message: "Game data not available yet. Try again later."

## Follow-ups

- Pin `pathofexile-dat-schema` to exact version with Dependabot PRs
- Pre-build art sprites to fully remove client-side bundle downloading
- Move minimap spritesheet generation to pipeline
