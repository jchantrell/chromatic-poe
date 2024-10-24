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
  ExitIcon,
  HouseIcon,
  MinimiseIcon,
  PaletteIcon,
} from "@pkgs/icons";
import { Avatar, AvatarImage } from "@pkgs/ui/avatar";
import { onMount } from "solid-js";
import { store } from "./store";
import { Toaster } from "@pkgs/ui/sonner";
import { Settings } from "./components/settings";
import { Route, Router } from "@solidjs/router";
import chromatic from "./lib/config";

export const storageManager = createLocalStorageManager("theme");

function App() {
  onMount(async () => {
    await chromatic.init();
  });

  return (
    <>
      <ColorModeScript storageType={storageManager.type} />
      <ColorModeProvider storageManager={storageManager}>
        <div class='h-screen flex flex-row overflow-hidden select-none'>
          <nav
            class='h-full flex flex-1 flex-col items-center justify-between py-2.5'
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
                    store.filter = null;
                  }}
                >
                  <HouseIcon />
                </Button>
              </a>
              <a href='/styles'>
                <Button
                  variant='ghost'
                  size='icon'
                  class='h-14 w-14'
                  onMouseDown={() => null}
                >
                  <PaletteIcon />
                </Button>
              </a>
              <a href='/sounds'>
                <Button
                  variant='ghost'
                  size='icon'
                  class='h-14 w-14'
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
          <div class='w-[calc(100%-4.5rem)]'>
            <nav
              class='w-full flex justify-between items-center h-14'
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

            <main
              class='h-[calc(100%-3.5rem)] w-full flex rounded-tl-2xl bg-primary-foreground overflow-auto overflow-x-hidden'
              onContextMenu={(e) => e.preventDefault()}
            >
              <Router>
                <Route path='/' component={() => <Editor />} />
              </Router>
            </main>
          </div>
        </div>
        <Toaster />
      </ColorModeProvider>
    </>
  );
}

export default App;
