// Seed the SEO tables: upsert the keyword map (src/data/seo-keywords.ts) and load rank snapshots from JSON files.
//   node --env-file-if-exists=.env.local --experimental-strip-types scripts/seo-seed.ts
//   node ... scripts/seo-seed.ts docs/seo/baseline-2026-10-08.json   # also import that snapshot (skipped if already imported)
// Keywords removed from the file are left in the DB; delete them from the dashboard or SQL if you want them gone.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { SEO_KEYWORDS } from "../src/data/seo-keywords.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const rows = SEO_KEYWORDS.map(({ keyword, intent, target_path, priority, difficulty, strategy, notes }) => ({ keyword, intent, target_path, priority, difficulty, strategy, notes, updated_at: new Date().toISOString() }));
const { error: e1, count } = await db.from("seo_keywords").upsert(rows, { onConflict: "keyword", count: "exact" });
console.log(e1 ? `seo_keywords: ${e1.message}` : `seo_keywords: ${count ?? rows.length} upserted`);

type Snapshot = {
  checked_at: string;
  source: string;
  ranks?: { keyword: string; engine: string; position: number | null; url: string | null; query?: string; notes?: string }[];
  ai?: { prompt: string; engine: string; position: number | null; cited: boolean | null; url: string | null; notes?: string }[];
};

for (const file of process.argv.slice(2).filter((a) => a.endsWith(".json"))) {
  const snap = JSON.parse(fs.readFileSync(file, "utf8")) as Snapshot;
  const { count: existing } = await db.from("seo_ranks").select("id", { count: "exact", head: true }).eq("source", snap.source);
  if (existing) { console.log(`${file}: already imported (${existing} rows with source ${snap.source})`); continue; }
  const out = [
    ...(snap.ranks || []).map((r) => ({ keyword: r.keyword, engine: r.engine, position: r.position, url: r.url, cited: null, depth: 20, source: snap.source, notes: [r.query && r.query !== r.keyword ? `query: "${r.query}"` : "", r.notes || ""].filter(Boolean).join(" · "), checked_at: snap.checked_at })),
    ...(snap.ai || []).map((r) => ({ keyword: r.prompt, engine: r.engine, position: r.position, url: r.url, cited: r.cited, depth: r.engine === "web" ? 20 : null, source: snap.source, notes: r.notes || null, checked_at: snap.checked_at })),
  ];
  const { error } = await db.from("seo_ranks").insert(out);
  console.log(error ? `${file}: ${error.message}` : `${file}: ${out.length} rank rows imported`);
}
