import { Settings } from "@app/components/settings";
import Tooltip from "@app/components/tooltip";
import { REDO_KEY, SAVE_KEY, UNDO_KEY, WRITE_KEY } from "@app/constants";
import {
  AudioIcon,
  DownloadIcon,
  ExitIcon,
  HouseIcon,
  MinimiseIcon,
  RedoIcon,
  SaveIcon,
  UndoIcon,
} from "@app/icons";
import chromatic from "@app/lib/config";
import { dat } from "@app/lib/dat";
import { checkForUpdate } from "@app/lib/update";
import Editor from "@app/pages/editor";
import LoadScreen from "@app/pages/load-screen";
import SoundManager from "@app/pages/sound";
import {
  refreshSounds,
  setInitialised,
  setPoeCurrentVersions,
  store,
} from "@app/store";
import { Avatar, AvatarImage } from "@app/ui/avatar";
import { Button } from "@app/ui/button";
import { Toaster } from "@app/ui/sonner";
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from "@kobalte/core";
import { Route, Router } from "@solidjs/router";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { createSignal, type JSXElement, onMount } from "solid-js";
import { toast } from "solid-sonner";
import { to } from "./lib/utils";
import "./app.css";
import { input } from "./lib/input";

export const BASE_URL = import.meta.env.BASE_URL;
export const storageManager = createLocalStorageManager("theme");

const ZOOM_LEVELS = [0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5];

function Link(props: {
  href: string;
  children: JSXElement;
  disabled?: boolean;
}) {
  return (
    <Button
      class='h-14 w-14'
      variant='ghost'
      size='icon'
      disabled={props.disabled}
    >
      <a class='size-full flex items-center justify-center' href={props.href}>
        {props.children}
      </a>
    </Button>
  );
}

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
        <Tooltip text='Home'>
          <Link href={BASE_URL}>
            <HouseIcon />
          </Link>
        </Tooltip>
        <Tooltip text='Manage Sounds'>
          <Link href={`${BASE_URL}sound`}>
            <AudioIcon />
          </Link>
        </Tooltip>
      </div>
      <div class='flex flex-col gap-2 items-center'>
        <Settings />
      </div>
    </nav>
  );
}

function TopBar() {
  return (
    <nav
      class='w-full flex justify-between items-center h-12'
      data-tauri-drag-region
    >
      <div
        class='flex items-center justify-between w-full gap-2'
        data-tauri-drag-region
      >
        {store.filter ? (
          <>
            <div class='ml-2 font-semibold text-xl mr-4 flex '>
              {store.filter?.name} (PoE {store.filter.poeVersion})
            </div>
            <div>
              <Tooltip text={`Undo (Ctrl + ${UNDO_KEY.toUpperCase()})`}>
                <Button
                  variant='ghost'
                  size='icon'
                  disabled={!store.filter.undoStack.length}
                  onMouseUp={() => {
                    store.filter?.undo();
                  }}
                >
                  <UndoIcon />
                </Button>
              </Tooltip>
              <Tooltip text={`Redo (Ctrl + ${REDO_KEY.toUpperCase()})`}>
                <Button
                  variant='ghost'
                  size='icon'
                  disabled={!store.filter.redoStack.length}
                  onMouseUp={() => {
                    store.filter?.redo();
                  }}
                >
                  <RedoIcon />
                </Button>
              </Tooltip>
              <Tooltip text={`Save (Ctrl + ${SAVE_KEY.toUpperCase()})`}>
                <Button
                  variant='ghost'
                  size='icon'
                  onMouseUp={() => {
                    toast("Saving filter...");
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
            </div>
          </>
        ) : null}
      </div>
      <div class='flex'>
        {chromatic.runtime === "desktop" && (
          <>
            <Tooltip text={"Minimise"}>
              <Button
                variant='ghost'
                size='icon'
                class='h-14 rounded-none'
                onMouseUp={() => chromatic.minimize()}
              >
                <MinimiseIcon />
              </Button>
            </Tooltip>
            <Tooltip text={"Exit"}>
              <Button
                variant='ghost'
                size='icon'
                class='h-14 rounded-none'
                onMouseUp={() => chromatic.close()}
              >
                <ExitIcon />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
    </nav>
  );
}

function Main() {
  return (
    <main
      class='rounded-tl-xl bg-primary-foreground absolute inset-0'
      onContextMenu={(e) => e.preventDefault()}
    >
      <Router>
        <Route path={BASE_URL} component={() => <LoadScreen />} />
        <Route path={`${BASE_URL}:filter`} component={() => <Editor />} />
        <Route path={`${BASE_URL}sound`} component={() => <SoundManager />} />
      </Router>
    </main>
  );
}

function App() {
  const [zoom, setZoom] = createSignal(4);

  document.addEventListener("wheel", async (event) => {
    if (event.ctrlKey && chromatic.runtime === "desktop") {
      const view = getCurrentWebview();
      if (event.deltaY > 0 && ZOOM_LEVELS[zoom() - 1]) {
        setZoom(zoom() - 1);
      } else if (event.deltaY < 0 && ZOOM_LEVELS[zoom() + 1]) {
        setZoom(zoom() + 1);
      } else {
        return;
      }

      return view.setZoom(ZOOM_LEVELS[zoom()]);
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

  onMount(async () => {
    input.on(
      "keypress",
      (
        key: string,
        pressed: boolean,
        event: { shift: boolean; alt: boolean; ctrl: boolean },
      ) => {
        if (!pressed || !store.filter) return;

        if (key === UNDO_KEY && event.ctrl && pressed) {
          return store?.filter?.undo();
        }

        if (key === REDO_KEY && event.ctrl && pressed) {
          return store?.filter?.redo();
        }

        if (key === SAVE_KEY && event.ctrl && pressed) {
          return store.filter?.save();
        }

        if (key === WRITE_KEY && event.ctrl && pressed) {
          return store.filter?.writeFile();
        }
      },
    );
    const [versionError, currentVersions] = await to(dat.fetchPoeVersions());
    if (versionError) {
      console.error("Failed to fetch latest PoE versions", versionError);
      return;
    }
    setPoeCurrentVersions(currentVersions);
    await chromatic.init();
    await chromatic.getAllFilters();
    setInitialised(true);
    await refreshSounds();
    await checkForUpdate();
    //setInterval(autosave, 15000);
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
        <div class='grid h-screen size-full grid-cols-[80px_1fr] fixed inset-0 font-fontin'>
          <SideBar />
          <div class='size-full flex flex-col'>
            <TopBar />
            <div class='flex-1 relative overflow-hidden'>
              <Main />
            </div>
          </div>
        </div>
        <Toaster
          theme='dark'
          toastOptions={{
            style: {
              background: "hsl(var(--accent))",
            },
          }}
        />
      </ColorModeProvider>
    </>
  );
}

export default App;
