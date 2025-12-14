export interface BlobSound {
  displayName: string;
  id: string;
  path: string;
  type: "custom";
  data: Blob;
}
export interface FileSound {
  displayName: string;
  id: string;
  path: string;
  type: "custom";
  data: File;
}
export interface CachedSound {
  displayName: string;
  id: string;
  path: string;
  type: "cached";
  data: null;
}
export interface DefaultSound {
  displayName: string;
  id: string;
  path: string;
  type: "default";
  data: null;
}
export type Sound = BlobSound | FileSound | CachedSound | DefaultSound;

export const DEFAULT_FILTER_SOUNDS: DefaultSound[] = [
  {
    displayName: "1",
    id: "AlertSound1",
    path: "sounds/AlertSound1.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "2",
    id: "AlertSound2",
    path: "sounds/AlertSound2.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "3",
    id: "AlertSound3",
    path: "sounds/AlertSound3.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "4",
    id: "AlertSound4",
    path: "sounds/AlertSound4.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "5",
    id: "AlertSound5",
    path: "sounds/AlertSound5.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "6",
    id: "AlertSound6",
    path: "sounds/AlertSound6.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "7",
    id: "AlertSound7",
    path: "sounds/AlertSound7.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "8",
    id: "AlertSound8",
    path: "sounds/AlertSound8.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "9",
    id: "AlertSound9",
    path: "sounds/AlertSound9.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "10",
    id: "AlertSound10",
    path: "sounds/AlertSound10.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "11",
    id: "AlertSound11",
    path: "sounds/AlertSound11.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "12",
    id: "AlertSound12",
    path: "sounds/AlertSound12.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "13",
    id: "AlertSound13",
    path: "sounds/AlertSound13.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "14",
    id: "AlertSound14",
    path: "sounds/AlertSound14.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "15",
    id: "AlertSound15",
    path: "sounds/AlertSound15.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "16",
    id: "AlertSound16",
    path: "sounds/AlertSound16.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Alchemy",
    id: "AlertSoundShAlchemy",
    path: "sounds/AlertSoundShAlchemy.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Blessed",
    id: "AlertSoundShBlessed",
    path: "sounds/AlertSoundShBlessed.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Chaos",
    id: "AlertSoundShChaos",
    path: "sounds/AlertSoundShChaos.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Divine",
    id: "AlertSoundShDivine",
    path: "sounds/AlertSoundShDivine.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Exalted",
    id: "AlertSoundShExalted",
    path: "sounds/AlertSoundShExalted.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Fusing",
    id: "AlertSoundShFusing",
    path: "sounds/AlertSoundShFusing.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "General",
    id: "AlertSoundShGeneral",
    path: "sounds/AlertSoundShGeneral.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Mirror",
    id: "AlertSoundShMirror",
    path: "sounds/AlertSoundShMirror.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Regal",
    id: "AlertSoundShRegal",
    path: "sounds/AlertSoundShRegal.mp3",
    type: "default",
    data: null,
  },
  {
    displayName: "Vaal",
    id: "AlertSoundShVaal",
    path: "sounds/AlertSoundShVaal.mp3",
    type: "default",
    data: null,
  },
];
