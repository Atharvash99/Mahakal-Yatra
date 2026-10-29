"use client";

import Link from "next/link";
import { useState } from "react";
import { inr } from "@/lib/api";
import { STATUS_OPTIONS, shortDate, type BookingRow } from "@/lib/staff";
import { useFetch } from "./useFetch";
import { Badge, Button, Card, Empty, ErrorNote, Loading, PageHeader, Table, inputClass, td } from "./ui";

const PAGE = 25;

type Filters = { q: string; status: string; from: string; to: string };
const BLANK: Filters = { q: "", status: "", from: "", to: "" };

export default function BookingList() {
  const [draft, setDraft] = useState<Filters>(BLANK);
  const [applied, setApplied] = useState<Filters>(BLANK);
  const [page, setPage] = useState(0);

  const params = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE) });
  if (applied.q) params.set("q", applied.q);
  if (applied.status) params.set("status", applied.status);
  if (applied.from) params.set("from", applied.from);
  if (applied.to) params.set("to", applied.to);
  const { data, error, loading, reload } = useFetch<{ total: number; results: BookingRow[] }>(`/bookings/?${params}`);

  function apply(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(0);
    setApplied(draft);
  }
  function clear() {
    setDraft(BLANK);
    setApplied(BLANK);
    setPage(0);
  }

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const filtered = Object.values(applied).some(Boolean);

  return (
    <>
      <PageHeader title="Bookings" subtitle="Search by reference, customer name or phone." />

      <form onSubmit={apply} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input className={inputClass + " mt-0"} placeholder="Search ref, name or phone" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} aria-label="Search" />
        <select className={inputClass + " mt-0"} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} aria-label="Status">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input className={inputClass + " mt-0"} type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} aria-label="Trips from" />
        <input className={inputClass + " mt-0"} type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} aria-label="Trips until" />
        <div className="flex gap-2">
          <Button type="submit" variant="primary">Search</Button>
          {filtered && <Button onClick={clear}>Clear</Button>}
        </div>
      </form>

      {error && <ErrorNote retry={reload}>{error}</ErrorNote>}
      <Card flush>
        {loading && !data ? (
          <Loading />
        ) : data && data.results.length === 0 ? (
          <Empty>{filtered ? "No bookings match these filters." : "No bookings yet."}</Empty>
        ) : (
          data && (
            <Table head={["Booking", "Customer", "Package", "Travel date", "Pax", "Status", "Total", "Balance", "Driver"]}>
              {data.results.map((b) => (
                <tr key={b.ref} className="hover:bg-slate-50/60">
                  <td className={td}><Link href={`/staff/bookings/${b.ref}`} className="font-medium text-maroon hover:underline">{b.ref}</Link></td>
                  <td className={td}>{b.customer_name}<span className="block text-xs text-slate-500">{b.phone}</span></td>
                  <td className={td}>{b.package_name}</td>
                  <td className={td}>{shortDate(b.travel_date)}</td>
                  <td className={td}>{b.travellers}</td>
                  <td className={td}><Badge tone={b.status}>{b.status_label}</Badge></td>
                  <td className={`${td} tabular-nums`}>{inr(b.total)}</td>
                  <td className={`${td} tabular-nums`}>{b.balance ? inr(b.balance) : "—"}</td>
                  <td className={td}>{b.driver ?? "—"}</td>
                </tr>
              ))}
            </Table>
          )
        )}
        {data && total > 0 && (
          <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>{page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} of {total}</span>
            <span className="flex items-center gap-2">
              <Button size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="tabular-nums">Page {page + 1} of {pages}</span>
              <Button size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </span>
          </footer>
        )}
      </Card>
    </>
  );
}
