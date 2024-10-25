import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@pkgs/ui/context-menu";
import { Collapsible } from "@pkgs/ui/collapsible";
import { store } from "@app/store";
import { getIcon, setEntryActive, type FilterCategory } from "@app/lib/filter";

function Category(props: {
  category: FilterCategory;
}) {
  const icon = getIcon(props.category);

  return (
    <>
      <Collapsible class='grid'>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              class={`p-1 border ${props.category.enabled ? "text-primary" : "text-accent"} cursor-pointer hover:border-primary h-full items-center flex justify-between select-none`}
              onMouseDown={(e: MouseEvent) => {
                // traverse down if children are categories
                if (e.button === 0 && !e.shiftKey) {
                  store.activeView = props.category;
                  store.crumbs = [
                    ...store.crumbs,
                    { title: props.category.name, view: props.category },
                  ];
                }

                // disable category and all descendants if modifier held
                if (e.button === 0 && e.shiftKey) {
                  store.filter?.execute(
                    setEntryActive(props.category, !props.category.enabled),
                  );
                }
              }}
            >
              <div class='flex items-center justify-center min-w-max'>
                {icon ? (
                  <figure class='max-w-lg shrink-0'>
                    <img
                      class='mr-1 h-8 max-w-full pointer-events-none'
                      alt={`${props.category.name} icon`}
                      src={icon}
                    />
                  </figure>
                ) : (
                  <></>
                )}
                <div class='pointer-events-none text-xl p-1'>
                  {props.category.name}
                </div>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuPortal>
            <ContextMenuContent class='w-48'>
              <ContextMenuItem
                onMouseDown={() =>
                  store.filter?.execute(
                    setEntryActive(props.category, !props.category.enabled),
                  )
                }
              >
                <span>{props.category.enabled ? "Disable" : "Enable"}</span>
                <ContextMenuShortcut>⇧+LClick</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <span>Copy</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => store.filter.undo()}>
                <span>Undo</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenuPortal>
        </ContextMenu>
      </Collapsible>
    </>
  );
}

export default Category;
