import { dat } from "@app/lib/dat";
import type { FilterRule } from "@app/lib/filter";
import { createResource } from "solid-js";
import { MinimapIcon } from "./map-icon-picker";

export function DropPreview(props: {
  rule?: FilterRule;
  dynamicSize?: boolean;
  showIcon?: boolean;
  iconScale?: number;
}) {
  if (!props.rule) return null;

  const [icons] = createResource(async () => {
    const url = await dat.getArt("minimap");
    const img = new Image();

    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url || "";
    });

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    return { url, height, width };
  });

  return (
    <div
      class='flex text-nowrap items-center justify-center border-[1.5px] min-w-fit max-h-fit px-3'
      style={{
        color: `rgba(${props.rule.actions.text?.r ?? 0}, ${props.rule.actions.text?.g ?? 0}, ${props.rule.actions.text?.b ?? 0}, ${(props.rule.actions.text?.a ?? 255) / 255})`,
        "border-color": `rgba(${props.rule.actions.border?.r ?? 0}, ${props.rule.actions.border?.g ?? 0}, ${props.rule.actions.border?.b ?? 0}, ${(props.rule.actions.border?.a ?? 255) / 255})`,
        "background-color": `rgba(${props.rule.actions.background?.r ?? 0}, ${props.rule.actions.background?.g ?? 0}, ${props.rule.actions.background?.b ?? 0}, ${(props.rule.actions.background?.a ?? 255) / 255})`,
        "max-width": `${(props.rule.actions.fontSize || 32) * 6}px`,
        "font-size": props.dynamicSize
          ? `${(props.rule.actions.fontSize || 32) / 1.5}px`
          : "",
      }}
    >
      <div class='mr-1'>
        {props.rule.actions.icon?.enabled && props.showIcon ? (
          <MinimapIcon
            sheet={icons()?.url}
            sheetHeight={icons()?.height}
            scale={props?.iconScale || 2}
            size={props.rule.actions.icon?.size}
            shape={props.rule.actions.icon?.shape}
            color={props.rule.actions.icon?.color}
          />
        ) : (
          ""
        )}
      </div>
      {props.rule.bases.length ? props.rule.bases[0].name : "Item"}
    </div>
  );
}
