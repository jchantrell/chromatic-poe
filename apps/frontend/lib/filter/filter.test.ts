import { generate, setEntryActive } from "@app/lib/filter";
import { expect, test } from "vitest";

test("setEntryActive", async () => {
  const filter = await generate("test", 1);
  const entry = filter.rules.children[1].children[2];
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
  filter.execute(setEntryActive(entry, false));
  expect(entry.enabled).toBe(false);
  expect(entry.children[0].enabled).toBe(false);
  filter.execute(setEntryActive(entry, true));
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
});

test("undo & redo", async () => {
  const filter = await generate("test", 1);
  const entry = filter.rules.children[1].children[2];

  // 1st state
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
  expect(filter.undoStack.length).toBe(0);

  // 2nd state
  filter.execute(setEntryActive(entry, false));
  expect(entry.enabled).toBe(false);
  expect(entry.children[0].enabled).toBe(false);
  expect(filter.undoStack.length).toBe(1);

  // 3rd state
  filter.execute(setEntryActive(entry, true));
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
  expect(filter.undoStack.length).toBe(2);

  // 4th state
  filter.execute(setEntryActive(entry, false));
  expect(entry.enabled).toBe(false);
  expect(entry.children[0].enabled).toBe(false);
  expect(filter.undoStack.length).toBe(3);

  // [true, false, true, false]

  filter.undo(); // 3rd state
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
  expect(filter.undoStack.length).toBe(2);

  filter.undo(); // 2nd state
  expect(entry.enabled).toBe(false);
  expect(entry.children[0].enabled).toBe(false);
  expect(filter.undoStack.length).toBe(1);

  filter.undo(); // 1st state
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
  expect(filter.undoStack.length).toBe(0);
  expect(filter.redoStack.length).toBe(3);

  filter.redo(); // 2nd state
  expect(entry.enabled).toBe(false);
  expect(entry.children[0].enabled).toBe(false);
  expect(filter.undoStack.length).toBe(1);
  expect(filter.redoStack.length).toBe(2);

  filter.redo(); // 3rd state
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
  expect(filter.undoStack.length).toBe(2);
  expect(filter.redoStack.length).toBe(1);

  filter.undo(); // 2nd state
  expect(entry.enabled).toBe(false);
  expect(entry.children[0].enabled).toBe(false);
  expect(filter.undoStack.length).toBe(1);
  expect(filter.redoStack.length).toBe(2);

  filter.undo();
  filter.undo();
  filter.undo();
  filter.undo(); // original state
  expect(entry.enabled).toBe(true);
  expect(entry.children[0].enabled).toBe(true);
  expect(filter.undoStack.length).toBe(0);
  expect(filter.redoStack.length).toBe(3);

  filter.redo();
  filter.redo();
  filter.redo();
  filter.redo(); // final state
  expect(entry.enabled).toBe(false);
  expect(entry.children[0].enabled).toBe(false);
  expect(filter.undoStack.length).toBe(3);
  expect(filter.redoStack.length).toBe(0);
});
