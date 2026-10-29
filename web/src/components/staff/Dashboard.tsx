"use client";

import Link from "next/link";
import { useState } from "react";
import { inr } from "@/lib/api";
import { clock, longDate, shortDate, type BookingRow, type Overview } from "@/lib/staff";
import AssignModal from "./AssignModal";
import { useStaff } from "./StaffProvider";
import { useFetch } from "./useFetch";
import { Badge, Button, Card, Empty, ErrorNote, Loading, PageHeader, Stat, Table, td } from "./ui";

export default function Dashboard() {
  const { user } = useStaff();
  const { data, error, loading, reload } = useFetch<Overview>("/overview/");
  const [target, setTarget] = useState<BookingRow | null>(null);

  if (error) return <ErrorNote retry={reload}>{error}</ErrorNote>;
  if (loading && !data) return <Loading />;
  if (!data || !user) return null;

  const can = user.can;
  const pendingTotal = data.pending_refunds.reduce((n, r) => n + r.amount, 0);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={longDate(data.today)} actions={<Button onClick={reload} busy={loading}>Refresh</Button>} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
        <Stat label="Trips today" value={data.trips_today.length} hint={`${data.trips_today.filter((t) => !t.driver).length} without a driver`} />
        <Stat label="Need a driver" value={data.unassigned.length} tone={data.unassigned.length ? "warn" : "good"} hint="Confirmed, not yet assigned" />
        {can.refunds && (
          <Stat label="Pending refunds" value={data.pending_refunds.length} tone={data.pending_refunds.length ? "warn" : "good"} hint={pendingTotal ? `${inr(pendingTotal)} to pay out` : "All paid out"} />
        )}
        {can.enquiries && <Stat label="New enquiries" value={data.new_enquiries} hint="Waiting for a first reply" />}
        {can.finance && data.finance_30d && (
          <Stat label="Next 30 days" value={inr(data.finance_30d.revenue)} hint={`${data.finance_30d.bookings} bookings · ${inr(data.finance_30d.margin)} margin`} />
        )}
      </div>

      <div className="mt-6 space-y-6">
        <Card title="Today's trips" flush>
          {data.trips_today.length === 0 ? (
            <Empty>No trips today.</Empty>
          ) : (
            <Table head={["Booking", "Customer", "Package", "Pax", "Pickup", "Driver", "Balance"]}>
              {data.trips_today.map((b) => (
                <tr key={b.ref}>
                  <td className={td}><Link href={`/staff/bookings/${b.ref}`} className="font-medium text-maroon hover:underline">{b.ref}</Link></td>
                  <td className={td}>{b.customer_name}<span className="block text-xs text-slate-500">{b.phone}</span></td>
                  <td className={td}>{b.package_name}</td>
                  <td className={td}>{b.travellers}</td>
                  <td className={td}>{b.pickup_point || "—"}{b.pickup_time && <span className="block text-xs text-slate-500">{clock(b.pickup_time)}</span>}</td>
                  <td className={td}>
                    {b.driver ? <>{b.driver}<span className="block text-xs text-slate-500">{b.vehicle}</span></> : <Badge tone="pending_payment">Not assigned</Badge>}
                  </td>
                  <td className={td}>{b.balance ? inr(b.balance) : "Paid"}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={`Needs a driver (${data.unassigned.length})`} flush>
          {data.unassigned.length === 0 ? (
            <Empty>Every confirmed booking has a driver.</Empty>
          ) : (
            <Table head={["Booking", "Date", "Customer", "Package", "Pax", ""]}>
              {data.unassigned.map((b) => (
                <tr key={b.ref}>
                  <td className={td}><Link href={`/staff/bookings/${b.ref}`} className="font-medium text-maroon hover:underline">{b.ref}</Link></td>
                  <td className={td}>{shortDate(b.travel_date)}</td>
                  <td className={td}>{b.customer_name}</td>
                  <td className={td}>{b.package_name}</td>
                  <td className={td}>{b.travellers}</td>
                  <td className={`${td} text-right`}>
                    {can.assign && <Button size="sm" variant="primary" onClick={() => setTarget(b)}>Assign</Button>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {can.refunds && (
          <Card title={`Pending refunds (${data.pending_refunds.length})`} action={<Link href="/staff/refunds" className="text-sm font-medium text-maroon hover:underline">Manage refunds</Link>} flush>
            {data.pending_refunds.length === 0 ? (
              <Empty>No refunds waiting.</Empty>
            ) : (
              <Table head={["Booking", "Customer", "Amount", "Policy"]}>
                {data.pending_refunds.map((r) => (
                  <tr key={r.id}>
                    <td className={td}><Link href={`/staff/bookings/${r.booking_ref}`} className="font-medium text-maroon hover:underline">{r.booking_ref}</Link></td>
                    <td className={td}>{r.customer_name}</td>
                    <td className={td}>{inr(r.amount)}</td>
                    <td className={td}>{r.percent}% refund</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        )}
      </div>

      <AssignModal booking={target} onClose={() => setTarget(null)} onDone={reload} />
    </>
  );
}
