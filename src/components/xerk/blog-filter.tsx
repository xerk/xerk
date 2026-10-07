"use client";
import { useState, type ReactNode } from "react";

/** Tag chips that filter the server-rendered cards (all posts stay in the HTML for crawlers). */
export function BlogFilter({ tags, children }: { tags: string[]; children: ReactNode }) {
  const [tag, setTag] = useState<string | null>(null);
  return (
    <div className="xk-blog" data-filter={tag || ""}>
      <div className="xk-chips xk-blog-tags" role="toolbar" aria-label="Filter by topic">
        <button type="button" aria-pressed={!tag} onClick={() => setTag(null)}>All</button>
        {tags.map((t) => <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>#{t}</button>)}
      </div>
      <style>{tag ? `.xk-blog-grid .xk-bcard:not([data-tags~="${tag.replace(/"/g, "")}"]){display:none}` : ""}</style>
      {children}
    </div>
  );
}
