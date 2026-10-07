export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(date: string) {
  const d = new Date(date.length <= 7 ? date + "-01" : date);
  return d.toLocaleDateString("en-US", { month: "short", day: date.length > 7 ? "numeric" : undefined, year: "numeric" });
}

export function readingTime(text: string) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 220)) + " min";
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
