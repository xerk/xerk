/* Tiny inline-SVG rank sparkline for the SEO page. No hooks and no server imports, so client components can use it. */

/** Rank history: lower is better, so position 1 sits at the top. Null (not found) drops to the floor. */
export function Sparkline({ values, depth = 20, width = 96, height = 26 }: { values: (number | null)[]; depth?: number; width?: number; height?: number }) {
  if (!values.length) return <span className="xk-seo-spark is-empty" aria-label="No checks yet">no data</span>;
  const floor = Math.max(depth, ...values.map((v) => v ?? 0)) + 1;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * (width - 4) + 2;
    const y = 3 + (((v ?? floor) - 1) / (floor - 1)) * (height - 6);
    return [x, y, v] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts.at(-1)!;
  return (
    <svg className="xk-seo-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Positions: ${values.map((v) => v ?? "not ranked").join(", ")}`}>
      <line x1="0" x2={width} y1={height - 2} y2={height - 2} className="floor" />
      {pts.length > 1 && <path d={d} />}
      {pts.map(([x, y, v], i) => <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 2.6 : 1.6} className={v === null ? "is-miss" : undefined} />)}
      <title>{last[2] === null ? "Not in the checked results" : `#${last[2]}`}</title>
    </svg>
  );
}
