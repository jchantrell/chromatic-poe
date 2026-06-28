import { Settings } from "@app/components/settings";
import Tooltip from "@app/components/tooltip";
import { REDO_KEY, SAVE_KEY, UNDO_KEY, WRITE_KEY } from "@app/constants";
import {
  ArrowLeftIcon,
  AudioIcon,
  DownloadIcon,
  ExitIcon,
  MinimiseIcon,
  RedoIcon,
  SaveIcon,
  UndoIcon,
} from "@app/icons";
import chromatic from "@app/lib/config";
import { dat } from "@app/lib/dat";
import { fetchLatestPatches } from "@app/lib/data-release";
import { checkForUpdate } from "@app/lib/update";
import Editor from "@app/pages/editor";
import LoadScreen from "@app/pages/load-screen";
import SoundManager from "@app/pages/sound";
import {
  refreshSounds,
  setAutosave,
  setFont,
  setInitialised,
  setPoeCurrentVersions,
  store,
} from "@app/store";
import { Button } from "@app/ui/button";
import { Toaster } from "@app/ui/sonner";
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from "@kobalte/core";
import { Route, Router, useLocation, useNavigate } from "@solidjs/router";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { createSignal, type JSXElement, onMount, Show } from "solid-js";
import { toast } from "solid-sonner";
import "./app.css";
import { input } from "./lib/input";
import { to } from "./lib/utils";

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

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const onLoadScreen = () => location.pathname === BASE_URL;

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(BASE_URL);
    }
  }

  return (
    <nav
      class='w-full flex justify-between items-center bg-muted h-12'
      data-tauri-drag-region
    >
      <div class='flex items-center w-full gap-2' data-tauri-drag-region>
        <Show when={!onLoadScreen()}>
          <Tooltip text='Back'>
            <Button
              class='h-14 w-14'
              variant='ghost'
              size='icon'
              onClick={goBack}
            >
              <ArrowLeftIcon />
            </Button>
          </Tooltip>
        </Show>
        {store.filter && (
          <>
            <div class='text-xl mr-4 flex '>
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
                  disabled={!store.filter.dirty}
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
            </div>
          </>
        )}
      </div>
      <div class='flex items-center'>
        <Tooltip text='Manage Sounds'>
          <Link href={`${BASE_URL}sound`}>
            <AudioIcon />
          </Link>
        </Tooltip>
        <Settings />
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

function AppLayout(props: { children?: JSXElement }) {
  return (
    <div
      class={`flex flex-col h-screen size-full fixed inset-0 font-${store.font}`}
    >
      <TopBar />
      <div class='flex-1 relative overflow-hidden'>
        <main
          class='rounded-tl-xl absolute inset-0'
          onContextMenu={(e) => e.preventDefault()}
        >
          {props.children}
        </main>
      </div>
    </div>
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
    const [versionError, currentVersions] = await to(
      (async () => (await fetchLatestPatches()) ?? dat.fetchPoeVersions())(),
    );
    if (versionError) {
      console.error("Failed to fetch latest PoE versions", versionError);
      toast.error("Failed to fetch PoE version info", {
        description:
          versionError instanceof Error
            ? versionError.message
            : String(versionError),
      });
      return;
    }
    setPoeCurrentVersions(currentVersions);
    await dat.ensureDbInitialized();
    await chromatic.init();
    if (chromatic.config?.font) {
      setFont(chromatic.config.font);
    }
    if (chromatic.config?.autosave) {
      setAutosave(true);
    }
    window.addEventListener("beforeunload", () => {
      store.filter?.flushAutosave();
    });
    await chromatic.getAllFilters();
    store.missingUniques = await chromatic.loadAllMissingUniques();
    store.allUniques = await chromatic.loadAllUniques();
    setInitialised(true);
    await refreshSounds(2, true);
    await checkForUpdate();
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
        <Router root={AppLayout}>
          <Route path={BASE_URL} component={() => <LoadScreen />} />
          <Route path={`${BASE_URL}:filter`} component={() => <Editor />} />
          <Route path={`${BASE_URL}sound`} component={() => <SoundManager />} />
        </Router>
        <Toaster
          theme='dark'
          toastOptions={{
            style: {
              background: "var(--accent)",
            },
          }}
        />
      </ColorModeProvider>
    </>
  );
}

export default App;
