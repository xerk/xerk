import { LeadsTable, type Lead } from "@/components/admin/leads-table";
import { adminDb } from "@/lib/supabase";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function AdminLeads() {
  const db = adminDb();
  const { data, error } = db ? await db.from("leads").select("*").order("created_at", { ascending: false }).limit(500) : { data: [], error: null };
  const leads = (data || []) as Lead[];
  return (
    <>
      <div className="xk-admin-head">
        <div><span className="xk-label">Inbox</span><h1>Leads</h1><p>{leads.length} total · {leads.filter((l) => l.status === "new").length} new</p></div>
      </div>
      {error && <p className="xk-admin-msg is-error">{error.message}</p>}
      <LeadsTable leads={leads} />
    </>
  );
}
