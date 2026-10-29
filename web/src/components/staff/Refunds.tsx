"use client";

import Link from "next/link";
import { useState } from "react";
import { inr } from "@/lib/api";
import { dateTime, type Refund } from "@/lib/staff";
import { useStaff } from "./StaffProvider";
import { useFetch } from "./useFetch";
import { Badge, Button, Card, Empty, ErrorNote, Loading, Modal, PageHeader, Table, td, useToast } from "./ui";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "processed", label: "Processed" },
  { key: "", label: "All" },
] as const;

export default function Refunds() {
  const { user, call } = useStaff();
  const toast = useToast();
  const [tab, setTab] = useState<string>("pending");
  const { data, error, loading, reload } = useFetch<{ results: Refund[] }>(`/refunds/${tab ? `?status=${tab}` : ""}`);
  const [target, setTarget] = useState<Refund | null>(null);
  const [busy, setBusy] = useState(false);

  async function process() {
    if (!target) return;
    setBusy(true);
    const r = await call(`/refunds/${target.id}/process/`, {});
    setBusy(false);
    if (r.ok) { toast("ok", `Refund for ${target.booking_ref} marked as processed.`); setTarget(null); reload(); }
    else toast("error", r.data.detail ?? "Could not process the refund.");
  }

  const total = data?.results.reduce((n, r) => n + r.amount, 0) ?? 0;

  return (
    <>
      <PageHeader title="Refunds" subtitle="Cancellations create a refund from the booking's cancellation policy. Pay it out, then mark it processed here." />
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {error && <ErrorNote retry={reload}>{error}</ErrorNote>}
      <Card flush>
        {loading && !data ? (
          <Loading />
        ) : data && data.results.length === 0 ? (
          <Empty>{tab === "pending" ? "No refunds waiting. Nice." : "No refunds here."}</Empty>
        ) : (
          data && (
            <>
              <Table head={["Booking", "Customer", "Amount", "Policy", "Created", "Status", ""]}>
                {data.results.map((r) => (
                  <tr key={r.id}>
                    <td className={td}><Link href={`/staff/bookings/${r.booking_ref}`} className="font-medium text-maroon hover:underline">{r.booking_ref}</Link></td>
                    <td className={td}>{r.customer_name}</td>
                    <td className={`${td} tabular-nums`}>{inr(r.amount)}</td>
                    <td className={td}>{r.percent}%</td>
                    <td className={td}>{dateTime(r.created_at)}</td>
                    <td className={td}><Badge tone={r.status}>{r.status}</Badge></td>
                    <td className={`${td} text-right`}>
                      {r.status === "pending" && user?.can.process_refunds && <Button size="sm" variant="primary" onClick={() => setTarget(r)}>Mark processed</Button>}
                    </td>
                  </tr>
                ))}
              </Table>
              <footer className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600">Total shown: <span className="font-medium tabular-nums text-slate-900">{inr(total)}</span></footer>
            </>
          )
        )}
      </Card>

      <Modal
        open={!!target}
        title="Mark refund as processed?"
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button onClick={() => setTarget(null)}>Not yet</Button>
            <Button variant="primary" busy={busy} onClick={process}>Mark processed</Button>
          </>
        }
      >
        {target && (
          <p className="text-sm text-slate-600">
            Confirm that {inr(target.amount)} has been paid back to {target.customer_name} for {target.booking_ref}. The booking will move to Refunded.
          </p>
        )}
      </Modal>
    </>
  );
}
