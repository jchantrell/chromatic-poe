# TLDR

Chromatic is a [SolidJS](https://www.solidjs.com/) application made with [Tauri](https://tauri.app/) that utilises Path of Exile's dat files at build time to supply most of the needed data.

Requirements (based on WSL & Linux):
- Node 20+
- pnpm 8+
- Rust 1.70+

## Setup

Run `ci/setup.sh` to do a complete build of the project. If this script does not work for you for whatever reason, the steps it does are as follows: 
- Install dependencies via pnpm
- Fetch the latest game files via `pathofexile-dat`, using `curl` and `jq` to fetch and append the latest patch versions from [vitaminmoo's patch server proxy](https://poe-versions.obsoleet.org/)
- Call `pnpm dat` (which runs `packages/data/dat.ts`). This will:
1. Transform the extracted game files into a local SQLite DB (`chromatic.db` in root directory)
2. Query the built SQLite DB for a transformed version of the game's items for use in the frontend
3. Query PoE Wiki's [Cargo API](https://www.poewiki.net/wiki/Path_of_Exile_Wiki:Data_query_API) for information that cannot be inferred from the game files and append to SQLite query output
4. Extract all needed images and other assets into the `packages/assets` directory and update the extracted items with paths to the extracted assets
5. Write the extracted items to `packages/data/{version}/items.json` for use in the frontend (which is just imported as JSON using Vite)

After these steps have been completed, you can the dev server using `pnpm dev` and you can build the project using `pnpm build` to build for the system you are on. Alternatively if you are on Linux/WSL and want to build for Windows, you can run `pnpm build:windows`.

## Frontend with SolidJS

> Located in `apps/frontend`

If you haven't used SolidJS before, it is a UI library that is similar to React. This project heavily utilises Solid's stores which are similar to Immer/Redux or mobx, where I've lent pretty heavily into the latter (mutability over immutability) as it makes behaviours like undo/redos, recursive changes, etc. much simpler to work with.

## Backend with Tauri

> Located in `apps/backend`

Tauri takes the SolidJS frontend application and wraps it with [WebView](https://v2.tauri.app/reference/webview-versions/). Tauri's [documentation](https://tauri.app/start/) will provide a more comprehensive overview of the backend ecosystem, but in summary...

The project uses these Tauri plugins:
- `OS Information` (differentiates between Windows, Linux and macOS)
- `File System` (access patterns similar to NodeJS `fs`)
- `Dialog` (file/directory pickers)
- `Opener` (open system file explorer)
- `Updater` (automatic updates based on GitHub action + JSON in each release)
- `Process` (used for automatic updates)

`apps/backend/capabilities/default.json` defines the permissions that the program has on the system it's installed on, which is enforced by the Tauri runtime. Tauri's documentation provides a really good overview of capabilities [here](https://tauri.app/security/) and [here](https://tauri.app/reference/acl/capability/).

 As an example, Chromatic can only access and manipulate files within [AppConfig](https://tauri.app/reference/javascript/api/namespacepath/#appconfig) (e.g. `C:\Users\Username\AppData\Roaming\chromatic`) and [Home](https://tauri.app/reference/javascript/api/namespacepath/#home) (e.g. `C:\Users\Username\`) on Windows systems.
