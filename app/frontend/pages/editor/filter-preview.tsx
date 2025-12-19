import { store } from "@app/store";
import { createVirtualizer } from "@tanstack/solid-virtual";
import { createMemo, For } from "solid-js";

export default function Preview() {
  return (
    <div class='flex flex-col size-full items-center justify-center p-2'>
      <VirtualPreview />
    </div>
  );
}

function VirtualPreview() {
  let parentRef: HTMLDivElement | undefined;

  const lines = createMemo(() => {
    return store.filter?.serialize().split(/\r?\n/) ?? [];
  });

  const virtualizer = createVirtualizer({
    get count() {
      return lines().length;
    },
    getScrollElement: () => parentRef || null,
    estimateSize: () => 20,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      class='border border-accent-foreground/25 text-sm text-wrap py-1 px-2 bg-primary-foreground/60 overflow-x-hidden overflow-y-auto resize-none outline-hidden size-full scrollbar-thumb-neutral-600'
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) => (
            <div
              data-index={virtualRow.index}
              ref={(el) => queueMicrotask(() => virtualizer.measureElement(el))}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                "white-space": "pre-wrap",
                "overflow-wrap": "anywhere",
              }}
            >
              {lines()[virtualRow.index] || "\u00A0"}
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
