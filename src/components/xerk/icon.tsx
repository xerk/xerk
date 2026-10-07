import data from "./icon-data.json";
import { cx } from "@/lib/utils";

type Paths = (string | number)[][];
const ICONS = data.icons as Record<string, Paths>;
const BRANDS = data.brands as Record<string, Paths>;

/** Phosphor (regular, or `name-duo` for duotone) and Simple Icons brand marks, all currentColor. */
export function Icon({ name, brand, className, label }: { name?: string; brand?: string; className?: string; label?: string }) {
  const b = brand ? BRANDS[brand] : undefined;
  const set = b || (name && ICONS[name]) || ICONS["arrow-up-right"];
  return (
    <svg className={cx("xk-icon", className)} viewBox={b ? "0 0 24 24" : "0 0 256 256"} fill="currentColor" aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      {set.map((d, i) => <path key={i} d={d[0] as string} opacity={d[1] as number | undefined} />)}
    </svg>
  );
}
