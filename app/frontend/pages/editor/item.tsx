import { dat } from "@app/lib/dat";
import type { FilterItem } from "@app/lib/filter";
import type { Setter } from "solid-js";
import { createSignal, onMount } from "solid-js";

function Image(props: { item: FilterItem }) {
  const [art, setArt] = createSignal<string | undefined>(undefined);

  onMount(() => {
    dat.getArt(props.item.name).then((url) => {
      setArt(url);
    });
  });

  return (
    <figure class='max-w-lg'>
      <img
        class={`mr-1 h-8 max-w-full pointer-events-none ${props.item.enabled ? "" : "grayscale"}`}
        alt={`${props.item.name} icon`}
        src={art()}
      />
    </figure>
  );
}

export function Visual(props: { item: FilterItem; class?: string }) {
  return (
    <div
      class={`p-1 px-2 text-primary cursor-pointer border items-center flex select-none ${props.class}`}
    >
      <Image item={props.item} />
      <div class='pointer-events-none text-lg text-nowrap'>
        {props.item.name}
        {props.item.category === "Uniques" && (
          <span class='ml-1 text-xs text-secondary-foreground/50'>
            {" "}
            {props.item.base}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Item(props: {
  item: FilterItem;
  setHovered: Setter<boolean>;
}) {
  return (
    <li>
      <Visual class='hover:border-accent' item={props.item} />
    </li>
  );
}
