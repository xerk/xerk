import type { Metadata } from "next";
import { Icon } from "@/components/xerk/icon";
import { ConfirmButton, StatusText } from "@/components/admin/shared";
import { Alert, Chip, EmptyState, KpiGrid, PageHeader, Panel, RankList, Skeleton, TagPreview } from "@/components/admin/ui";

export const metadata: Metadata = { title: "UI kit" };

const SWATCHES = ["--bg", "--surface", "--surface-raised", "--border", "--border-strong", "--ink", "--ink-muted", "--accent", "--accent-text", "--accent-soft", "--agent", "--warning", "--danger"];

const CLASSES: [string, string][] = [
  ["xk-admin / xk-admin-main", "App shell grid and the main column (layout.tsx)"],
  ["xk-admin-nav, -navgroup, -navlink, -who", "Sidebar: brand, grouped links, user footer; drawer under 900px"],
  ["xk-admin-head  ·  <PageHeader>", "Page title: eyebrow, h1, description, meta chips, actions"],
  ["xk-admin-stack", "Vertical rhythm (24px gap) for editor pages"],
  ["xk-admin-panel (.is-flush)  ·  <Panel>", "Card section; -panel-head / -panel-foot"],
  ["xk-admin-grid (.is-2)", "Responsive card grid"],
  ["xk-admin-kpis / -kpi  ·  <KpiGrid>", "Stat tiles strip (.is-accent, .is-agent, link tiles)"],
  ["xk-admin-ticks", "HUD corner ticks (use sparingly)"],
  ["xk-admin-chip  ·  <Chip>", ".is-accent .is-agent .is-warning .is-danger .has-dot .is-outline .is-tag"],
  ["xk-admin-table-wrap / -table", "Sticky header, row hover; td.is-num, .is-shrink; -cell-title / -cell-sub"],
  ["xk-admin-empty  ·  <EmptyState>", "Empty state with icon, copy and actions"],
  ["xk-admin-toolbar / -toolbar-end / -search / -count", "Filters row above lists"],
  ["xk-admin-tabs (.is-mobile-only)", "Segmented control; buttons with aria-pressed"],
  ["xk-field, xk-field-row(.is-3), xk-field-hint, xk-field-error", "Form fields (refined inside .xk-admin)"],
  ["xk-admin-input / xk-admin-select(.is-sm, data-tone)", "Standalone controls outside .xk-field"],
  ["xk-admin-affix", "Input with a fixed prefix (/blog/…)"],
  ["xk-admin-taglist  ·  <TagPreview>", "Comma field rendered as chips"],
  ["xk-switch / xk-admin-switches", "Toggle switch on a checkbox"],
  ["xk-admin-bar", "Sticky save bar at the bottom of editors"],
  ["xk-admin-msg (.is-ok .is-error .is-busy .is-dirty)  ·  <StatusText>", "Inline status"],
  ["xk-admin-alert (.is-error .is-warning)  ·  <Alert>", "Block message"],
  ["xk-admin-toast", "Floating toast card"],
  ["xk-confirm  ·  <ConfirmButton>", "Two-step destructive action"],
  ["xk-btn-danger, xk-iconbtn-sm(.is-danger), xk-linkbtn", "Admin-only buttons"],
  ["xk-drop, xk-media-grid / -tile", "Upload drop zone and media library"],
  ["xk-order / -item / -handle / -side", "Reorderable list (projects, screens)"],
  ["xk-repeat / -item / -head / -index", "Repeater blocks (sections, FAQ)"],
  ["xk-admin-rank  ·  <RankList>", "Ranked list with proportional bars"],
  ["xk-admin-skel  ·  <Skeleton>", "Loading placeholders (.is-title .is-block .is-circle)"],
];

export default function UiKit() {
  return (
    <>
      <PageHeader
        eyebrow="System"
        title="UI kit"
        description="The dashboard's primitives in one place. Styles live in src/styles/admin.css; React helpers in src/components/admin/ui.tsx."
        meta={<><Chip dot tone="accent">admin.css</Chip><Chip outline>8px grid</Chip><Chip outline>light + dark</Chip></>}
        actions={<><button type="button" className="xk-btn xk-btn-ghost xk-btn-sm">Ghost</button><button type="button" className="xk-btn xk-btn-secondary xk-btn-sm"><Icon name="plus" />Secondary</button><button type="button" className="xk-btn xk-btn-primary xk-btn-sm"><Icon name="check" />Primary</button></>}
      />

      <Panel title="Tokens" icon="palette" description="Theme colors come from tokens.css and flip with data-theme.">
        <div className="xk-admin-swatches">{SWATCHES.map((v) => <span key={v} className="xk-admin-swatch"><i style={{ background: `var(${v})` }} />{v}</span>)}</div>
      </Panel>

      <div className="xk-admin-stack" style={{ gap: 12 }}>
        <h2 className="xk-admin-section-title">KPI tiles</h2>
        <KpiGrid ticks items={[
          { label: "Visitors", value: 1284, icon: "users", hint: "+12% vs last week" },
          { label: "Pageviews", value: 4410, icon: "chart-line-up" },
          { label: "Leads", value: 7, icon: "envelope-simple", tone: "accent", href: "#tables", hint: "Open inbox" },
          { label: "AI answers", value: 52, icon: "robot", tone: "agent" },
        ]} />
      </div>

      <div className="xk-admin-grid is-2">
        <Panel title="Chips & badges" icon="seal-check">
          <div className="xk-admin-demo-row">
            <Chip>neutral</Chip><Chip dot tone="accent">published</Chip><Chip dot tone="warning">draft</Chip><Chip dot tone="agent">replied</Chip><Chip dot tone="danger">spam</Chip><Chip outline>/blog/slug</Chip><Chip tag>#nextjs</Chip><Chip icon="star" tone="accent">featured</Chip>
          </div>
        </Panel>
        <Panel title="Buttons" icon="cursor-click">
          <div className="xk-admin-demo-row">
            <button type="button" className="xk-btn xk-btn-primary xk-btn-sm">Publish</button>
            <button type="button" className="xk-btn xk-btn-secondary xk-btn-sm">Save draft</button>
            <button type="button" className="xk-btn xk-btn-ghost xk-btn-sm">Cancel</button>
            <button type="button" className="xk-btn xk-btn-danger xk-btn-sm">Delete</button>
            <button type="button" className="xk-iconbtn-sm" aria-label="Up"><Icon name="arrow-up" /></button>
            <button type="button" className="xk-iconbtn-sm is-danger" aria-label="Remove"><Icon name="trash" /></button>
            <button type="button" className="xk-linkbtn">Show all</button>
          </div>
          <div className="xk-admin-demo-row"><ConfirmButton label="Two-step delete" question="Delete this?" onConfirm={async () => { "use server"; }} /></div>
        </Panel>
      </div>

      <Panel title="Form" icon="pen-nib" description="Fields, hints, errors, affix input, select, tag input and toggles.">
        <div className="xk-field-row">
          <label className="xk-field"><span>Title</span><input defaultValue="Shipping a realtime platform" /><span className="xk-field-hint">Hint text sits under the control</span></label>
          <label className="xk-field"><span>Slug</span><span className="xk-admin-affix"><span>/blog/</span><input className="is-mono" defaultValue="realtime-platform" /></span></label>
        </div>
        <div className="xk-field-row is-3">
          <label className="xk-field"><span>Status</span><select defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label>
          <label className="xk-field"><span>Date</span><input type="date" defaultValue="2026-10-08" /></label>
          <label className="xk-field has-error"><span>Email</span><input defaultValue="not-an-email" /><span className="xk-field-error"><Icon name="warning-circle" />Enter a valid email</span></label>
        </div>
        <label className="xk-field"><span>Tags</span><input defaultValue="nodejs, ai, architecture" /><TagPreview value="nodejs, ai, architecture" /><span className="xk-field-hint"><span>Comma separated</span><span className="is-count">3/8</span></span></label>
        <label className="xk-field"><span>Summary</span><textarea rows={2} defaultValue="One or two sentences for cards, RSS and search results." /></label>
        <div className="xk-admin-switches">
          <label className="xk-switch"><input type="checkbox" defaultChecked />Published</label>
          <label className="xk-switch"><input type="checkbox" />Featured</label>
          <label className="xk-switch"><input type="checkbox" disabled />Disabled</label>
        </div>
      </Panel>

      <div className="xk-admin-stack" style={{ gap: 12 }} id="tables">
        <div className="xk-admin-toolbar">
          <div className="xk-admin-tabs" role="group" aria-label="Demo filter"><button type="button" aria-pressed="true">all<span className="xk-admin-count">3</span></button><button type="button" aria-pressed="false">new<span className="xk-admin-count">1</span></button><button type="button" aria-pressed="false">replied<span className="xk-admin-count">2</span></button></div>
          <label className="xk-field xk-admin-search"><Icon name="magnifying-glass" /><input placeholder="Search…" aria-label="Search demo" /></label>
          <div className="xk-admin-toolbar-end"><span className="xk-admin-count">3 rows</span></div>
        </div>
        <div className="xk-admin-table-wrap">
          <table className="xk-admin-table">
            <thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Owner</th></tr></thead>
            <tbody>
              {[["Realtime device platform", "published", "2026-09-30"], ["RAG over a CV", "draft", "—"], ["MCP server in a weekend", "replied", "2026-08-12"]].map(([t, s, d]) => (
                <tr key={t}><td><div className="xk-admin-cell-title"><a href="#tables">{t}</a><span className="xk-admin-cell-sub">/blog/{t.toLowerCase().replace(/\s+/g, "-")}</span></div></td><td className="is-shrink"><Chip dot tone={s === "published" ? "accent" : s === "draft" ? "warning" : "agent"}>{s}</Chip></td><td className="is-num">{d}</td><td>xerk</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="xk-admin-grid is-2">
        <Panel title="Ranked list" icon="chart-line-up"><RankList items={[["/", 412], ["/work/realtime-device-platform", 188], ["/blog", 96], ["/hire", 41]]} /></Panel>
        <Panel title="Status & feedback" icon="info">
          <div className="xk-admin-demo-row">
            <StatusText status={{ kind: "busy", text: "Saving…" }} />
            <StatusText status={{ kind: "ok", text: "Saved" }} />
            <StatusText status={{ kind: "error", text: "Upload failed" }} />
            <span className="xk-admin-msg is-dirty">Unsaved changes</span>
          </div>
          <Alert>Repo posts stay live from content/ until you save them here.</Alert>
          <Alert tone="error">Supabase returned an error: permission denied.</Alert>
          <div className="xk-admin-toast" role="status"><Icon name="check-circle" /><div><strong>Published</strong><span>The post is live at /blog/realtime-platform.</span></div></div>
        </Panel>
      </div>

      <div className="xk-admin-grid is-2">
        <EmptyState icon="tray" title="No leads yet" actions={<button type="button" className="xk-btn xk-btn-secondary xk-btn-sm">Share /hire</button>}>The contact form stores messages here and pings Telegram.</EmptyState>
        <Panel title="Skeletons" icon="clock">
          <Skeleton variant="title" />
          <Skeleton width="90%" /><Skeleton width="70%" /><Skeleton variant="block" />
        </Panel>
      </div>

      <Panel title="Lists" icon="list" description="Reorderable rows and repeaters.">
        <div className="xk-order">
          {["1-1 · Realtime device platform", "1-2 · AI support agent"].map((t, i) => (
            <div key={t} className="xk-order-item">
              <span className="xk-order-handle" aria-hidden><Icon name="dots-six-vertical" /></span>
              <span className="xk-order-thumb" />
              <div className="xk-order-title"><a href="#tables">{t.split(" · ")[1]}</a><span><b className="xk-order-code">{t.split(" · ")[0]}</b>Enterprise · AI</span></div>
              <div className="xk-order-side"><label className="xk-switch"><input type="checkbox" defaultChecked={i === 0} />{i === 0 ? "Live" : "Hidden"}</label><button type="button" className="xk-iconbtn-sm" aria-label="Up"><Icon name="arrow-up" /></button><button type="button" className="xk-iconbtn-sm" aria-label="Down"><Icon name="arrow-down" /></button></div>
            </div>
          ))}
        </div>
        <div className="xk-repeat">
          <div className="xk-repeat-item">
            <div className="xk-repeat-head"><span className="xk-repeat-index"><b>01</b>Section</span><div className="xk-admin-actions"><button type="button" className="xk-iconbtn-sm is-danger" aria-label="Remove"><Icon name="trash" /></button></div></div>
            <label className="xk-field"><span>Body</span><textarea rows={2} defaultValue="Paragraphs separated by a blank line." /></label>
          </div>
        </div>
        <div className="xk-drop" role="presentation"><Icon name="upload-simple" /><strong>Drop files here or click to upload</strong><span>Drop zone</span></div>
      </Panel>

      <Panel flush title="Class cheat-sheet" icon="code" description="Prefix everything admin-only with xk-admin-. Reuse xk-btn / xk-field from the public kit.">
        <div className="xk-admin-table-wrap">
          <table className="xk-admin-table">
            <thead><tr><th>Class · component</th><th>Use</th></tr></thead>
            <tbody>{CLASSES.map(([c, u]) => <tr key={c}><td className="is-num" style={{ color: "var(--ink)" }}>{c}</td><td>{u}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>

      <div className="xk-admin-bar">
        <div className="xk-admin-actions"><button type="button" className="xk-btn xk-btn-primary xk-btn-sm"><Icon name="check" />Save</button><button type="button" className="xk-btn xk-btn-secondary xk-btn-sm">Save draft</button></div>
        <div className="xk-admin-actions"><span className="xk-admin-msg is-dirty">Unsaved changes</span></div>
      </div>
    </>
  );
}
