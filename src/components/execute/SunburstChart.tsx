import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SunburstNode, ExecuteIndustry } from "@/types/execute";
import { CLUSTER_COLORS } from "@/data/privcybhubIndustries";

interface Props {
  tree: SunburstNode;
  selectedIds: Set<string>;
  onHover: (industry: ExecuteIndustry | null, breadcrumb: string[]) => void;
  onClick: (node: SunburstNode, additive: boolean) => void;
  size?: number;
}

type HNode = d3.HierarchyRectangularNode<SunburstNode>;

export function SunburstChart({ tree, selectedIds, onHover, onClick, size = 640 }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svgEl = ref.current;
    if (!svgEl) return;
    const radius = size / 2;

    const root = d3
      .hierarchy<SunburstNode>(tree, (d) => d.children)
      .sum((d) => (d.children && d.children.length ? 0 : 1))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3.partition<SunburstNode>().size([2 * Math.PI, radius])(root);

    const arc = d3
      .arc<HNode>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle(0.012)
      .padRadius(radius / 2)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => Math.max(d.y0 + 1, d.y1 - 2))
      .cornerRadius(4);

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg
      .attr("viewBox", `${-radius} ${-radius} ${size} ${size}`)
      .style("font", "11px DM Sans, sans-serif");

    const nodes = (root.descendants() as HNode[]).filter((d) => d.depth > 0);

    const path = svg
      .append("g")
      .selectAll("path")
      .data(nodes)
      .join("path")
      .attr("d", arc as never)
      .attr("fill", (d) => CLUSTER_COLORS[d.data.cluster_id ?? 1] ?? "hsl(220 30% 50%)")
      .attr("fill-opacity", (d) => 1 - (d.depth - 1) * 0.15)
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .on("mouseenter", function (_event, d) {
        d3.select(this).attr("fill-opacity", 1);
        const crumbs: string[] = [];
        let cur: HNode | null = d;
        while (cur && cur.depth > 0) {
          crumbs.unshift(cur.data.name);
          cur = cur.parent;
        }
        const ind = d.data.industry ?? null;
        onHover(ind, crumbs);
      })
      .on("mouseleave", function (_event, d) {
        d3.select(this).attr("fill-opacity", 1 - (d.depth - 1) * 0.15);
        onHover(null, []);
      })
      .on("click", (event: MouseEvent, d) => {
        onClick(d.data, event.metaKey || event.ctrlKey);
      });

    // ring labels for cluster ring (depth 1) only — keep it readable
    svg
      .append("g")
      .attr("pointer-events", "none")
      .selectAll("text")
      .data(nodes.filter((d) => d.depth === 1 && d.x1 - d.x0 > 0.12))
      .join("text")
      .attr("transform", (d) => {
        const a = ((d.x0 + d.x1) / 2) * (180 / Math.PI) - 90;
        const r = (d.y0 + d.y1) / 2;
        return `rotate(${a}) translate(${r},0) rotate(${a > 90 ? 180 : 0})`;
      })
      .attr("dy", "0.32em")
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--foreground))")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .text((d) => (d.data.name.length > 18 ? d.data.name.slice(0, 16) + "…" : d.data.name));

    // selection ring overlay
    path.attr("stroke", (d) => {
      const ids = d.data.leafIds ?? [];
      const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
      const someSelected = ids.some((id) => selectedIds.has(id));
      if (allSelected) return "hsl(var(--primary))";
      if (someSelected) return "hsl(var(--primary) / 0.5)";
      return "hsl(var(--background))";
    }).attr("stroke-width", (d) => {
      const ids = d.data.leafIds ?? [];
      const some = ids.some((id) => selectedIds.has(id));
      return some ? 2 : 0.8;
    });
  }, [tree, selectedIds, size, onHover, onClick]);

  return <svg ref={ref} width={size} height={size} className="block mx-auto" />;
}