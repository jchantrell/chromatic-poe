import { DEFAULT_STYLE, type RgbColor } from "@app/lib/action";
import type { FilterRule } from "@app/lib/filter";
import { store } from "@app/store";
import { MinimapIcon } from "./map-icon-picker";

/** Convert an RgbColor to a CSS rgba() string. */
function rgba(color: RgbColor): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}

export function DropPreview(props: {
  rule?: FilterRule;
  dynamicSize?: boolean;
  showIcon?: boolean;
  iconScale?: number;
}) {
  if (!props.rule) return null;

  const text = () =>
    props.rule!.actions.text?.enabled
      ? props.rule!.actions.text
      : DEFAULT_STYLE.text;
  const border = () =>
    props.rule!.actions.border?.enabled
      ? props.rule!.actions.border
      : undefined;
  const background = () =>
    props.rule!.actions.background?.enabled
      ? props.rule!.actions.background
      : DEFAULT_STYLE.background;

  return (
    <div
      class='flex text-nowrap items-center justify-center min-w-fit max-h-fit px-3'
      classList={{ "border-[1.5px]": !!border() }}
      style={{
        color: rgba(text()),
        "border-color": border() ? rgba(border()!) : undefined,
        "background-color": rgba(background()),
        "max-width": `${(props.rule.actions.fontSize || 32) * 6}px`,
        "font-size": props.dynamicSize
          ? `${(props.rule.actions.fontSize || 32) / 1.5}px`
          : "",
      }}
    >
      <div class='mr-1'>
        {props.rule.actions?.icon?.enabled && props.showIcon ? (
          <MinimapIcon
            sheet={store.iconSpritesheet.url}
            sheetHeight={store.iconSpritesheet.height}
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
