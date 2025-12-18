import { store } from "@app/store";

export default function Preview() {
  return (
    <div class='flex flex-col size-full items-center justify-center p-2'>
      <textarea
        id='rule-preview'
        spellcheck={false}
        class='border border-accent-foreground/25 text-sm text-wrap py-1 px-2 bg-primary-foreground/60 overflow-x-hidden overflow-y-auto resize-none outline-hidden size-full scrollbar-thumb-neutral-600'
      >
        {store.filter?.serialize()}
      </textarea>
    </div>
  );
}
