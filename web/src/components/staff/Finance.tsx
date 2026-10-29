"use client";

import { useState } from "react";
import { inr } from "@/lib/api";
import type { FinanceReport } from "@/lib/staff";
import { useFetch } from "./useFetch";
import { Button, Card, Empty, ErrorNote, Loading, PageHeader, Stat, Table, inputClass, td } from "./ui";

export default function Finance() {
  const [range, setRange] = useState<{ start: string; end: string } | null>(null);
  const [draft, setDraft] = useState({ start: "", end: "" });
  const qs = range ? `?start=${range.start}&end=${range.end}` : "";
  const { data, error, loading, reload } = useFetch<FinanceReport>(`/finance/${qs}`);

  // fill the pickers from the server's default range the first time it arrives
  const shown = { start: draft.start || data?.start || "", end: draft.end || data?.end || "" };
  const maxMargin = Math.max(1, ...(data?.by_package.map((p) => p.margin) ?? [0]));

  return (
    <>
      <PageHeader title="Finance" subtitle="Trips by travel date. Revenue includes GST; margin is before ads, salaries, gateway fees and overheads." />
      <form
        onSubmit={(e) => { e.preventDefault(); if (shown.start && shown.end) setRange(shown); }}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="text-sm font-medium text-slate-700">From
          <input className={inputClass} type="date" value={shown.start} onChange={(e) => setDraft({ ...shown, start: e.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">To
          <input className={inputClass} type="date" value={shown.end} onChange={(e) => setDraft({ ...shown, end: e.target.value })} />
        </label>
        <Button type="submit" variant="primary" busy={loading && !!data}>Update</Button>
      </form>

      {error && <ErrorNote retry={reload}>{error}</ErrorNote>}
      {loading && !data ? <Loading /> : data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Bookings" value={data.bookings} />
            <Stat label="Revenue" value={inr(data.revenue)} hint={`GST portion ${inr(data.tax)}`} />
            <Stat label="Margin" value={inr(data.margin)} hint={`${data.margin_percent}% of revenue · cost ${inr(data.cost)}`} tone="good" />
            <Stat label="Owed to suppliers" value={inr(data.payables_outstanding)} hint={`Refunds ${inr(data.refunds_total)} (${inr(data.refunds_pending)} pending)`} tone={data.payables_outstanding ? "warn" : undefined} />
          </div>

          <Card title="By package" flush>
            {data.by_package.length === 0 ? <Empty>No bookings in this range.</Empty> : (
              <Table head={["Package", "Bookings", "Revenue", "Margin", ""]}>
                {data.by_package.map((p) => (
                  <tr key={p.package_name}>
                    <td className={`${td} font-medium text-slate-900`}>{p.package_name}</td>
                    <td className={td}>{p.bookings}</td>
                    <td className={`${td} tabular-nums`}>{inr(p.revenue)}</td>
                    <td className={`${td} tabular-nums`}>{inr(p.margin)}</td>
                    <td className={`${td} w-48`}>
                      <div className="h-2 rounded-full bg-slate-100" role="img" aria-label={`Margin ${inr(p.margin)}`}>
                        <div className="h-2 rounded-full bg-maroon" style={{ width: `${Math.max(2, (p.margin / maxMargin) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
          <p className="text-xs text-slate-500">Confirm GST treatment with your CA. Prices and costs are placeholders until supplier rates are final.</p>
        </div>
      )}
    </>
  );
}
