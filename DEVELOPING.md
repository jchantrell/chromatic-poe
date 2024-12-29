# TLDR

Chromatic is a [SolidJS](https://www.solidjs.com/) application made with [Tauri](https://tauri.app/) that utilises Path of Exile's dat files at build time to supply (most) of the needed data.

## Frontend with SolidJS

> Located in `apps/frontend`

If you haven't used SolidJS before, it is a UI library that is similar to React. This project heavily utilises Solid's stores which are similar to Immer/Redux or mobx, where I've lent pretty heavily into the latter (mutability over immutability) as it makes behaviours like undo/redos, recursive changes, etc. much simpler to work with.

## Backend with Tauri

> Located in `apps/backend`

Tauri takes the SolidJS frontend application and wraps it with [WebView](https://v2.tauri.app/reference/webview-versions/). I am not heavily utilising the Rust backend at the moment and am more or less using it as a renderer akin to Electron.

## Data and Building

> Located in `packages/data`

The data fetching and transformation are driven by two things
- Scripts in the above directory, the entry being `packages/data/dat.ts` which builds out a local SQLite DB (which I found to be the easiest way to get the data in the right format for the application)
- Table fetching via the CLI tool [`pathofexile-dat`](https://github.com/SnosMe/poe-dat-viewer/tree/master/lib) 
- File fetching using a ported version of `pathofexile-dat`'s implementation. See `loader.ts`, `file.ts`, `sprite.ts`, `bundle.ts` and `table.ts` in `packages/data`.
