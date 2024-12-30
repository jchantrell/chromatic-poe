import "./app.css";
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from "@kobalte/core";
import Editor from "@app/pages/editor";
import { Button } from "@pkgs/ui/button";
import { AudioIcon, ExitIcon, HouseIcon, MinimiseIcon } from "@pkgs/icons";
import { Avatar, AvatarImage } from "@pkgs/ui/avatar";
import { createSignal, onMount } from "solid-js";
import { setFilter, store } from "./store";
import { Toaster } from "@pkgs/ui/sonner";
import { Settings } from "./components/settings";
import { Route, Router } from "@solidjs/router";
import chromatic from "./lib/config";
import { getCurrentWebview } from "@tauri-apps/api/webview";
export const storageManager = createLocalStorageManager("theme");

function SideBar() {
  return (
    <nav
      class='flex flex-col items-center justify-between py-2.5'
      data-tauri-drag-region
    >
      <div class='flex flex-col gap-2'>
        <Avatar class='w-14 h-14 cursor-pointer'>
          <AvatarImage src='https://web.poecdn.com/gen/image/WzAsMSx7ImlkIjo2MjYsInNpemUiOiJhdmF0YXIifV0/71ec2c3cb4/Path_of_Exile_Gallery_Image.jpg' />
        </Avatar>
        <a href='/'>
          <Button
            variant='ghost'
            size='icon'
            class='h-14 w-14'
            onMouseDown={() => {
              setFilter(null);
            }}
          >
            <HouseIcon />
          </Button>
        </a>
        <a href='/'>
          <Button
            variant='ghost'
            size='icon'
            class='h-14 w-14'
            disabled
            onMouseDown={() => null}
          >
            <AudioIcon />
          </Button>
        </a>
      </div>
      <div class='flex flex-col'>
        <Settings />
      </div>
    </nav>
  );
}

function TopBar() {
  return (
    <nav
      class='w-full flex justify-between items-center'
      data-tauri-drag-region
    >
      <div class='ml-2 font-semibold text-xl'>
        {store.filter ? `${store.filter?.name}` : ""}
      </div>
      <div class='flex'>
        <Button
          variant='ghost'
          size='icon'
          class='h-14 rounded-none'
          onMouseUp={() => chromatic.minimize()}
        >
          <MinimiseIcon />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          class='h-14 rounded-none'
          onMouseUp={() => chromatic.close()}
        >
          <ExitIcon />
        </Button>
      </div>
    </nav>
  );
}

function Main() {
  return (
    <main
      class='rounded-tl-2xl bg-primary-foreground absolute inset-0'
      onContextMenu={(e) => e.preventDefault()}
    >
      <Router>
        <Route path='/' component={() => <Editor />} />
      </Router>
    </main>
  );
}

function App() {
  onMount(async () => {
    await chromatic.init();
    await chromatic.getAllFilters();
  });
  const zoomLevels = [0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5];
  const [zoom, setZoom] = createSignal(4);

  document.addEventListener("wheel", async (event) => {
    if (event.ctrlKey) {
      const view = getCurrentWebview();
      if (event.deltaY > 0 && zoomLevels[zoom() - 1]) {
        setZoom(zoom() - 1);
      } else if (event.deltaY < 0 && zoomLevels[zoom() + 1]) {
        setZoom(zoom() + 1);
      } else {
        return;
      }

      return view.setZoom(zoomLevels[zoom()]);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "s" &&
      (navigator.userAgent.includes("Mac") ? event.metaKey : event.ctrlKey)
    ) {
      event.preventDefault();
    }
  });

  return (
    <>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider storageManager={storageManager}>
        <div class='grid h-screen size-full grid-cols-[80px,1fr] fixed inset-0'>
          <SideBar />
          <div class='size-full flex flex-col'>
            <TopBar />
            <div class='flex-1 relative overflow-hidden'>
              <Main />
            </div>
          </div>
        </div>
        <Toaster />
      </ColorModeProvider>
    </>
  );
}

export default App;
