import { LeadsTable, type Lead } from "@/components/admin/leads-table";
import { adminDb } from "@/lib/supabase";
import { Alert, Chip, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function AdminLeads() {
  const db = adminDb();
  const { data, error } = db ? await db.from("leads").select("*").order("created_at", { ascending: false }).limit(500) : { data: [], error: null };
  const leads = (data || []) as Lead[];
  const fresh = leads.filter((l) => l.status === "new").length;
  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Leads"
        description="Messages from the contact form on /hire. Change a status to keep the inbox tidy; it saves instantly."
        meta={<><Chip dot tone={fresh ? "accent" : "neutral"}>{fresh} new</Chip><Chip>{leads.length} total</Chip></>}
      />
      {error && <Alert tone="error">{error.message}</Alert>}
      <LeadsTable leads={leads} />
    </>
  );
}
