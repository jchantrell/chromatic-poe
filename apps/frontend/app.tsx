import "./app.css";
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from "@kobalte/core";
import Editor from "@app/pages/editor";
import { Button } from "@pkgs/ui/button";
import {
  AudioIcon,
  DownloadIcon,
  ExitIcon,
  HouseIcon,
  MinimiseIcon,
  SaveIcon,
} from "@pkgs/icons";
import { Avatar, AvatarImage } from "@pkgs/ui/avatar";
import { createSignal, onMount } from "solid-js";
import { setActiveRule, setFilter, store } from "./store";
import { Toaster } from "@pkgs/ui/sonner";
import { Settings } from "./components/settings";
import { Route, Router } from "@solidjs/router";
import chromatic from "./lib/config";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import Tooltip from "./components/tooltip";
import { SAVE_KEY, WRITE_KEY } from "@app/constants";

export const BASE_URL = import.meta.env.BASE_URL;
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
        <a href={BASE_URL}>
          <Button
            variant='ghost'
            size='icon'
            class='h-14 w-14'
            onMouseDown={() => {
              setActiveRule(null);
              setFilter(null);
            }}
          >
            <HouseIcon />
          </Button>
        </a>
        <a href={BASE_URL}>
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
      <div class='flex items-center gap-2'>
        {store.filter ? (
          <>
            <div class='ml-2 font-semibold text-xl mr-4'>
              {store.filter?.name} (PoE {store.filter.version})
            </div>
            <Tooltip text={`Save (Ctrl + ${SAVE_KEY.toUpperCase()})`}>
              <Button
                variant='ghost'
                size='icon'
                onMouseUp={() => {
                  store.filter?.save();
                }}
              >
                <SaveIcon />
              </Button>
            </Tooltip>
            <Tooltip text={`Export (Ctrl + ${WRITE_KEY.toUpperCase()})`}>
              <Button
                variant='ghost'
                size='icon'
                onMouseUp={() => {
                  store.filter?.writeFile();
                }}
              >
                <DownloadIcon />
              </Button>
            </Tooltip>
          </>
        ) : null}
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
        <Route path={BASE_URL} component={() => <Editor />} />
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
      [SAVE_KEY, WRITE_KEY].includes(event.key) &&
      (navigator.userAgent.includes("Mac") ? event.metaKey : event.ctrlKey)
    ) {
      event.preventDefault();
    }
  });

  return (
    <>
      <ColorModeScript
        storageType={storageManager.type}
        initialColorMode='dark'
      />
      <ColorModeProvider
        storageManager={storageManager}
        initialColorMode='dark'
      >
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
