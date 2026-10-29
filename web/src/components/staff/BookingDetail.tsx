"use client";

import Link from "next/link";
import { useState } from "react";
import { inr } from "@/lib/api";
import { clock, dateTime, longDate, type BookingDetail as Detail } from "@/lib/staff";
import AssignModal from "./AssignModal";
import { useStaff } from "./StaffProvider";
import { useFetch } from "./useFetch";
import { Badge, Button, Card, Empty, ErrorNote, Loading, Modal, Table, td, useToast } from "./ui";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default function BookingDetail({ bookingRef }: { bookingRef: string }) {
  const { user, call } = useStaff();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch<Detail>(`/bookings/${encodeURIComponent(bookingRef)}/`);
  const [assigning, setAssigning] = useState(false);
  const [confirm, setConfirm] = useState<"cancel" | "complete" | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(path: string, ok: string) {
    setBusy(true);
    const r = await call(`/bookings/${bookingRef}/${path}/`, {});
    setBusy(false);
    setConfirm(null);
    if (r.ok) { toast("ok", ok); reload(); } else toast("error", r.data.detail ?? "That did not work.");
  }

  if (error) return <ErrorNote retry={reload}>{error}</ErrorNote>;
  if (loading && !data) return <Loading />;
  if (!data || !user) return null;

  const can = user.can;
  const a = data.assignment;
  const p = data.price;
  const trip = {
    ref: data.ref, customer_name: data.customer_name, travellers: data.travellers, pickup_time: data.pickup_time,
  };

  return (
    <>
      <Link href="/staff/bookings" className="text-sm text-slate-500 hover:text-slate-800">← All bookings</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{data.ref}</h1>
            <Badge tone={data.status}>{data.status_label}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">{data.package_name} · {longDate(data.travel_date)} · booked {dateTime(data.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can.assign && data.actions.assign && <Button variant="primary" onClick={() => setAssigning(true)}>Assign driver</Button>}
          {can.manage_bookings && data.actions.driver_card && (
            <Button busy={busy} onClick={() => act("driver-card", "Driver card queued for the customer.")}>Send driver card</Button>
          )}
          {can.manage_bookings && data.actions.complete && <Button onClick={() => setConfirm("complete")}>Mark completed</Button>}
          {can.manage_bookings && data.actions.cancel && <Button variant="danger" onClick={() => setConfirm("cancel")}>Cancel booking</Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Customer & trip">
            <dl className="divide-y divide-slate-100">
              <Row label="Customer">{data.customer_name}</Row>
              <Row label="Phone"><a className="text-maroon hover:underline" href={`tel:${data.phone}`}>{data.phone}</a></Row>
              {data.email && <Row label="Email">{data.email}</Row>}
              <Row label="Travellers">{data.travellers}</Row>
              <Row label="Pickup point">{data.pickup_point || "—"}</Row>
              {data.festival_label && <Row label="Festival pricing">{data.festival_label}</Row>}
            </dl>
            {data.special_requests && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
                <span className="font-medium">Special requests: </span>{data.special_requests}
              </p>
            )}
            {data.travellers_list.length > 0 && (
              <ul className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-100 text-sm">
                {data.travellers_list.map((t, i) => (
                  <li key={i} className="flex items-center justify-between px-3 py-2">
                    <span>{t.name}{t.age ? `, ${t.age}` : ""}</span>
                    {t.needs_wheelchair && <Badge tone="pending_payment">Wheelchair</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Payments" flush>
            {data.payments.length === 0 ? (
              <Empty>No payments yet.</Empty>
            ) : (
              <Table head={["Type", "Amount", "Method", "Status", "Paid at"]}>
                {data.payments.map((x) => (
                  <tr key={x.id}>
                    <td className={`${td} capitalize`}>{x.kind}</td>
                    <td className={`${td} tabular-nums`}>{inr(x.amount)}</td>
                    <td className={`${td} capitalize`}>{x.provider}</td>
                    <td className={td}><Badge tone={x.status}>{x.status}</Badge></td>
                    <td className={td}>{x.paid_at ? dateTime(x.paid_at) : "—"}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          {data.refunds.length > 0 && (
            <Card title="Refunds" flush>
              <Table head={["Amount", "Policy", "Reason", "Status"]}>
                {data.refunds.map((r) => (
                  <tr key={r.id}>
                    <td className={`${td} tabular-nums`}>{inr(r.amount)}</td>
                    <td className={td}>{r.percent}%</td>
                    <td className={td}>{r.reason || "—"}</td>
                    <td className={td}><Badge tone={r.status}>{r.status}</Badge></td>
                  </tr>
                ))}
              </Table>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Driver & vehicle">
            {a ? (
              <dl className="divide-y divide-slate-100">
                <Row label="Driver">{a.driver.name}</Row>
                <Row label="Driver phone">{a.driver.phone}</Row>
                <Row label="Vehicle">{a.vehicle.kind} {a.vehicle.number}</Row>
                <Row label="Pickup time">{a.pickup_time ? clock(a.pickup_time) : "Not set"}</Row>
                <Row label="Driver card">{a.driver_card_sent_at ? `Sent ${dateTime(a.driver_card_sent_at)}` : "Not sent"}</Row>
                {a.started_at && <Row label="Started">{dateTime(a.started_at)}</Row>}
                {a.completed_at && <Row label="Completed">{dateTime(a.completed_at)}</Row>}
                {a.cash_collected > 0 && <Row label="Cash collected">{inr(a.cash_collected)}</Row>}
              </dl>
            ) : (
              <p className="text-sm text-slate-500">No driver assigned yet.</p>
            )}
          </Card>

          <Card title="Price">
            <dl className="divide-y divide-slate-100">
              <Row label="Per person">{inr(p.unit)}</Row>
              {p.addons.map((x) => <Row key={x.slug} label={x.name}>{inr(x.amount)}</Row>)}
              {p.discount > 0 && <Row label={`Coupon ${p.coupon}`}>− {inr(p.discount)}</Row>}
              <Row label="GST (included)">{inr(p.tax)}</Row>
              <Row label="Total">{inr(p.total)}</Row>
              <Row label="Paid">{inr(p.paid)}</Row>
              <Row label="Balance due">{inr(p.balance)}</Row>
              {p.margin !== undefined && p.cost !== undefined && (
                <>
                  <Row label="Supplier cost">{inr(p.cost)}</Row>
                  <Row label="Margin">{inr(p.margin)}</Row>
                </>
              )}
            </dl>
          </Card>

          <Card title="Cancellation policy">
            <ul className="space-y-1 text-sm text-slate-600">
              {data.cancellation_policy.map((r, i) => (
                <li key={i}>{r.refund_percent}% refund if cancelled {r.hours_before}+ hours before the trip</li>
              ))}
              <li>No refund after that</li>
            </ul>
          </Card>
        </div>
      </div>

      <AssignModal booking={assigning ? trip : null} onClose={() => setAssigning(false)} onDone={reload} />

      <Modal
        open={confirm === "cancel"}
        title={`Cancel ${data.ref}?`}
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Keep booking</Button>
            <Button variant="danger" busy={busy} onClick={() => act("cancel", `${data.ref} cancelled.`)}>Cancel booking</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          The seats are released and a refund is calculated from the cancellation policy and the time left before the trip.
          This cannot be undone.
        </p>
      </Modal>

      <Modal
        open={confirm === "complete"}
        title={`Mark ${data.ref} completed?`}
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Not yet</Button>
            <Button variant="primary" busy={busy} onClick={() => act("complete", `${data.ref} marked completed.`)}>Mark completed</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">Normally the driver completes the trip from their app. Use this only if they could not.</p>
      </Modal>
    </>
  );
}
