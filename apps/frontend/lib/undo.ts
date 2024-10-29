import {
  configure,
  type IObjectDidChange,
  type IArrayDidChange,
  type IMapDidChange,
} from "mobx";
import { deepObserve } from "mobx-utils";
import type { Operation } from "fast-json-patch";

type Change = IObjectDidChange | IArrayDidChange | IMapDidChange;
export type IListenerWithPatches = (undo: Patch, redo: Patch) => void;

export type Patch = Operation[];

export interface UndoRedoPatch {
  undo: Patch;
  redo: Patch;
}

export function getUndoRedoPatch(
  change: Change,
  parent: string,
): UndoRedoPatch {
  const redo: Patch = [];
  const undo: Patch = [];
  const { name, index, newValue, oldValue } = change;
  const path = (parent ? "/" + parent : "") + "/" + (name ?? index);

  switch (change.type) {
    case "add": {
      undo.push({ op: "remove", path });
      redo.push({ op: "add", path, value: newValue });
      break;
    }
    case "update": {
      undo.push({ op: "replace", path, value: oldValue });
      redo.push({ op: "replace", path, value: newValue });
      break;
    }
    case "remove":
    case "delete": {
      undo.push({ op: "add", path, value: oldValue });
      redo.push({ op: "remove", path });
      break;
    }
    case "splice": {
      const { index, removed, removedCount, added, addedCount } = change;
      for (let i = 0; i < removedCount; i++) {
        redo.push({ op: "remove", path });
      }
      for (let i = 0; i < addedCount; i++) {
        undo.push({ op: "remove", path });
        redo.push({ op: "add", path, value: added[i] });
      }
      for (let i = 0; i < removedCount; i++) {
        const path = `${parent ? `/${parent}` : ""}/${i + index}`;
        undo.push({ op: "add", path, value: removed[i] });
      }
      break;
    }
  }
  return { undo, redo };
}

export function observeChanges<T>(target: T, listener: IListenerWithPatches) {
  let undoStack: Patch[] = [];
  let redoStack: Patch[] = [];

  const notify = () => {
    if (undoStack.length || redoStack.length) {
      listener(undoStack.reverse().flat(), redoStack.flat());
      undoStack = [];
      redoStack = [];
    }
  };

  configure({
    reactionScheduler: (f): void => {
      f();
      notify();
    },
  });

  return deepObserve(target, (change: Change, parent: string) => {
    const { undo, redo } = getUndoRedoPatch(change, parent);
    undoStack.push(undo);
    redoStack.push(redo);
  });
}
