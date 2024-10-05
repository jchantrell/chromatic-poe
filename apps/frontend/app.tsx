import "./app.css";
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from "@kobalte/core";
import Editor from "@app/pages/editor";
import Setup from "@app/pages/setup";
import { Button } from "@pkgs/ui/button";
import { ExitIcon, MinimiseIcon, SettingsIcon } from "@pkgs/icons";
import { Avatar, AvatarImage } from "@pkgs/ui/avatar";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { fileSystem } from "@app/services/storage";
import { onMount } from "solid-js";
import { locale } from "@tauri-apps/plugin-os";
import { store } from "./store";
import Theme from "@app/components/theme";
import { LoadScreenMenu } from "@app/pages/load-screen";

function tryGetAppWindow(): ReturnType<typeof getCurrentWindow> | null {
  try {
    const appWindow = getCurrentWindow();
    return appWindow;
  } catch (err) {
    return null;
  }
}

const appWindow = tryGetAppWindow();

function App() {
  const storageManager = createLocalStorageManager("vite-ui-theme");

  onMount(async () => {
    if (appWindow) {
      await fileSystem.init();
      console.log("?");
      if (fileSystem.config.poeDirectory) {
        store.initialised = true;
      }
      store.filters = await fileSystem.listFilters();
    }
    if (!appWindow) {
      store.initialised = true;
    }
    store.locale = await locale();
  });

  return (
    <>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider storageManager={storageManager}>
        <div class='h-screen flex flex-row overflow-hidden'>
          <nav
            class='h-full flex flex-1 flex-col items-center justify-between py-2.5'
            data-tauri-drag-region
          >
            <div>
              <Avatar class='w-auto h-14 cursor-pointer'>
                <AvatarImage src='https://web.poecdn.com/gen/image/WzAsMSx7ImlkIjo2MjYsInNpemUiOiJhdmF0YXIifV0/71ec2c3cb4/Path_of_Exile_Gallery_Image.jpg' />
              </Avatar>
            </div>
            <div class='flex flex-col'>
              <Button variant='ghost'>
                <Theme />
              </Button>
              <Button variant='ghost' onClick={() => null}>
                <SettingsIcon />
              </Button>
            </div>
          </nav>
          <div class='w-[calc(100%-4.5rem)]'>
            <nav
              class='w-full flex justify-between items-center h-14'
              data-tauri-drag-region
            >
              <div class='ml-2 font-semibold text-xl'>
                {store.filter ? `${store.filter?.name}` : ""}
              </div>
              <div class='flex'>
                {appWindow ? (
                  <>
                    <Button
                      variant='ghost'
                      size='icon'
                      class='h-14 rounded-none'
                      onMouseUp={() => appWindow.minimize()}
                    >
                      <MinimiseIcon />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      class='h-14 rounded-none'
                      onMouseUp={() => appWindow.close()}
                    >
                      <ExitIcon />
                    </Button>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </nav>
            <main
              class='h-[calc(100%-3.5rem)] w-full rounded-tl-2xl bg-primary-foreground overflow-auto overflow-x-hidden'
              onContextMenu={(e) => e.preventDefault()}
            >
              {!store.initialised ? <Setup /> : <></>}
              {store.initialised && !store.filter ? <LoadScreenMenu /> : <></>}
              {store.initialised && store.filter ? <Editor /> : <></>}
            </main>
          </div>
        </div>
      </ColorModeProvider>
    </>
  );
}

export default App;
