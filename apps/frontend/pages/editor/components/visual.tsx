import { zoom, hierarchy, linkHorizontal, tree, create } from "d3";
import { createSignal } from "solid-js";
import type { ItemHierarchy } from "@app/types";

function visualise(
  data: ItemHierarchy,
  parentWidth: number,
  parentHeight: number,
) {
  const root = hierarchy(data, (d) => {
    return d.children.filter((entry) => entry.enabled);
  });

  const scalingFactor = 10;
  const width = parentWidth;
  const dx = 25;
  const dy = width / (root.height + 1) + scalingFactor;

  tree<ItemHierarchy>().nodeSize([dx, dy])(root);

  let x0 = Number.POSITIVE_INFINITY;

  let x1 = -x0;
  root.each((d) => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const computedHeight = x1 - x0 + dx * 2;

  const height = parentHeight > computedHeight ? parentHeight : computedHeight;

  const svg = create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("style", "width: 100%; height: 100%; font: 10px sans-serif;")
    .style("user-select", "none");

  const g = svg.append("g");

  g.append("g")
    .style("pointer-events", "all")
    .style("cursor", "pointer")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll()
    .data(root.links())
    .join("path")
    .attr(
      "d",
      linkHorizontal()
        .x((d) => d.y + scalingFactor)
        .y((d) => d.x + parentHeight / 2),
    );

  const node = g
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll()
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => {
      return `translate(${d.y + scalingFactor},${d.x + parentHeight / 2})`;
    });

  node
    .append("circle")
    .attr("fill", (d) => (d.children ? "#555" : "#999"))
    .attr("r", (d) => {
      if (d.data.icon) {
        return 0;
      }
      return 6;
    });

  node
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", (d) => {
      if (d.data.icon) {
        return 20;
      }
      return d.children ? -6 : 6;
    })
    .attr("text-anchor", (d) => (d.children ? "end" : "start"))
    .text((d) => {
      return d.data.name;
    })
    .attr("fill", "white")
    .attr("paint-order", "stroke");

  // TODO: optimise
  node
    .append("image")
    .attr("xlink:href", (d) => d.data.icon)
    .attr("x", "-12px")
    .attr("y", "-12px")
    .attr("width", "24px")
    .attr("height", "24px");

  const zoomer = zoom().scaleExtent([0.001, 100]).on("zoom", handleZoom);

  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .style("position", "absolute")
    .call(zoomer);

  function handleZoom({ transform }) {
    g.attr("transform", transform);
  }

  return svg.node();
}

function Visualiser(props: { data: ItemHierarchy }) {
  const [ref, setRef] = createSignal<HTMLDivElement>();
  return (
    <div ref={setRef} class='h-full w-full overflow-hidden'>
      {props.data.children.length ? (
        visualise(props.data, ref()?.clientWidth, ref()?.clientHeight)
      ) : (
        <></>
      )}
    </div>
  );
}

export default Visualiser;
