"use client";

import { useState } from "react";
import { dateTime, shortDate, type Enquiry } from "@/lib/staff";
import { useStaff } from "./StaffProvider";
import { useFetch } from "./useFetch";
import { Badge, Button, Card, Empty, ErrorNote, Field, Loading, Modal, PageHeader, Table, inputClass, td, useToast } from "./ui";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted to booking" },
  { value: "lost", label: "Lost" },
];

export default function Enquiries() {
  const { user, call } = useStaff();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (appliedQ) params.set("q", appliedQ);
  const { data, error, loading, reload } = useFetch<{ results: Enquiry[] }>(`/enquiries/?${params}`);

  const [open, setOpen] = useState<Enquiry | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  function edit(e: Enquiry) {
    setOpen(e);
    setNewStatus(e.status);
    setNotes(e.internal_notes);
  }

  async function save() {
    if (!open) return;
    setBusy(true);
    const r = await call(`/enquiries/${open.id}/`, { status: newStatus, internal_notes: notes });
    setBusy(false);
    if (r.ok) { toast("ok", "Enquiry updated."); setOpen(null); reload(); } else toast("error", r.data.detail ?? "Could not save.");
  }

  const waLink = (e: Enquiry) => `https://wa.me/91${e.phone.replace(/\D/g, "").slice(-10)}`;

  return (
    <>
      <PageHeader title="Enquiries" subtitle="Leads from the website form. Reply on WhatsApp, then track the outcome." />
      <form
        onSubmit={(e) => { e.preventDefault(); setAppliedQ(q); }}
        className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[2fr_1fr_auto]"
      >
        <input className={inputClass + " mt-0"} placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <select className={inputClass + " mt-0"} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Button type="submit" variant="primary">Search</Button>
      </form>

      {error && <ErrorNote retry={reload}>{error}</ErrorNote>}
      <Card flush>
        {loading && !data ? <Loading /> : data && data.results.length === 0 ? <Empty>No enquiries found.</Empty> : data && (
          <Table head={["Received", "Name", "Interest", "Travel date", "Pax", "Status", ""]}>
            {data.results.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50/60">
                <td className={td}>{dateTime(e.created_at)}</td>
                <td className={td}><span className="font-medium text-slate-900">{e.name}</span><span className="block text-xs text-slate-500">{e.phone}</span></td>
                <td className={td}>{e.package_slug || "General"}{e.message && <span className="block max-w-xs truncate text-xs text-slate-500">{e.message}</span>}</td>
                <td className={td}>{e.travel_date ? shortDate(e.travel_date) : "—"}</td>
                <td className={td}>{e.travellers}</td>
                <td className={td}><Badge tone={e.status}>{e.status_label}</Badge></td>
                <td className={`${td} space-x-2 text-right`}>
                  <a href={waLink(e)} target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 hover:underline">WhatsApp</a>
                  {user?.can.manage_enquiries && <Button size="sm" onClick={() => edit(e)}>Update</Button>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={!!open}
        title={open ? `Enquiry from ${open.name}` : "Enquiry"}
        onClose={() => setOpen(null)}
        footer={<><Button onClick={() => setOpen(null)}>Cancel</Button><Button variant="primary" busy={busy} onClick={save}>Save</Button></>}
      >
        {open?.message && <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{open.message}</p>}
        <Field label="Status">
          <select className={inputClass} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Internal notes" hint="Only staff can see these.">
          <textarea className={inputClass} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
        </Field>
      </Modal>
    </>
  );
}
