"use client";

import { useState } from "react";
import type { Driver, Vehicle } from "@/lib/staff";
import { useStaff } from "./StaffProvider";
import { useFetch } from "./useFetch";
import { Badge, Button, Card, Empty, ErrorNote, Field, Loading, Modal, PageHeader, Table, inputClass, td, useToast } from "./ui";

type Fleet = { drivers: Driver[]; vehicles: Vehicle[] };

export default function FleetPage() {
  const { user, call } = useStaff();
  const toast = useToast();
  const { data, error, loading, reload } = useFetch<Fleet>("/fleet/");
  const [form, setForm] = useState<"driver" | "vehicle" | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState<{ name: string; pin: string } | null>(null);

  const can = user?.can;
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setFields({ ...fields, [k]: e.target.value });

  function openForm(kind: "driver" | "vehicle") {
    setForm(kind);
    setFields(kind === "driver" ? { name: "", phone: "", years_experience: "1" } : { number: "", kind: "", capacity: "4", operator_name: "" });
    setProblem("");
  }

  async function save() {
    setBusy(true);
    setProblem("");
    const body = form === "driver"
      ? { name: fields.name, phone: fields.phone, years_experience: Number(fields.years_experience) || 1 }
      : { number: fields.number, kind: fields.kind, capacity: Number(fields.capacity), operator_name: fields.operator_name };
    const r = await call(form === "driver" ? "/fleet/drivers/" : "/fleet/vehicles/", body);
    setBusy(false);
    if (!r.ok) { setProblem(r.data.detail ?? "Could not save."); return; }
    toast("ok", form === "driver" ? "Driver added." : "Vehicle added.");
    setForm(null);
    reload();
  }

  async function toggle(kind: "drivers" | "vehicles", id: number, active: boolean) {
    const r = await call(`/fleet/${kind}/${id}/active/`, { active });
    if (r.ok) reload(); else toast("error", r.data.detail ?? "Could not update.");
  }

  async function resetPin(d: Driver) {
    const r = await call<{ pin: string }>(`/fleet/drivers/${d.id}/reset-pin/`, {});
    if (r.ok) { setPin({ name: d.name, pin: r.data.pin }); reload(); } else toast("error", r.data.detail ?? "Could not reset the PIN.");
  }

  if (error) return <ErrorNote retry={reload}>{error}</ErrorNote>;
  if (loading && !data) return <Loading />;
  if (!data) return null;

  return (
    <>
      <PageHeader title="Drivers & vehicles" subtitle="Partner drivers and cars you can assign to trips." />
      <div className="space-y-6">
        <Card title={`Drivers (${data.drivers.length})`} action={can?.manage_fleet && <Button size="sm" variant="primary" onClick={() => openForm("driver")}>Add driver</Button>} flush>
          {data.drivers.length === 0 ? <Empty>No drivers yet.</Empty> : (
            <Table head={["Name", "Phone", "Rating", "Experience", "Portal PIN", "Status", ""]}>
              {data.drivers.map((d) => (
                <tr key={d.id}>
                  <td className={`${td} font-medium text-slate-900`}>{d.name}</td>
                  <td className={td}>{d.phone}</td>
                  <td className={td}>★ {d.rating}</td>
                  <td className={td}>{d.years_experience} yr</td>
                  <td className={td}>{d.has_pin ? "Set" : <span className="text-amber-700">Not set</span>}</td>
                  <td className={td}><Badge tone={d.active ? "active" : "inactive"}>{d.active ? "Active" : "Inactive"}</Badge></td>
                  <td className={`${td} space-x-2 text-right`}>
                    {can?.manage_fleet && (
                      <>
                        <Button size="sm" onClick={() => resetPin(d)}>{d.has_pin ? "Reset PIN" : "Set PIN"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => toggle("drivers", d.id, !d.active)}>{d.active ? "Deactivate" : "Activate"}</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title={`Vehicles (${data.vehicles.length})`} action={can?.manage_fleet && <Button size="sm" variant="primary" onClick={() => openForm("vehicle")}>Add vehicle</Button>} flush>
          {data.vehicles.length === 0 ? <Empty>No vehicles yet.</Empty> : (
            <Table head={["Number", "Type", "Seats", "Operator", "Status", ""]}>
              {data.vehicles.map((v) => (
                <tr key={v.id}>
                  <td className={`${td} font-medium text-slate-900`}>{v.number}</td>
                  <td className={td}>{v.kind}</td>
                  <td className={td}>{v.capacity}</td>
                  <td className={td}>{v.operator_name || "—"}</td>
                  <td className={td}><Badge tone={v.active ? "active" : "inactive"}>{v.active ? "Active" : "Inactive"}</Badge></td>
                  <td className={`${td} text-right`}>
                    {can?.manage_fleet && <Button size="sm" variant="ghost" onClick={() => toggle("vehicles", v.id, !v.active)}>{v.active ? "Deactivate" : "Activate"}</Button>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      <Modal
        open={form !== null}
        title={form === "driver" ? "Add driver" : "Add vehicle"}
        onClose={() => setForm(null)}
        footer={<><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" busy={busy} onClick={save}>Save</Button></>}
      >
        {form === "driver" ? (
          <>
            <Field label="Full name"><input className={inputClass} value={fields.name ?? ""} onChange={set("name")} autoFocus /></Field>
            <Field label="Mobile number" hint="10 digits. The driver signs in to the portal with this."><input className={inputClass} type="tel" value={fields.phone ?? ""} onChange={set("phone")} /></Field>
            <Field label="Years of experience"><input className={inputClass} type="number" min={0} value={fields.years_experience ?? ""} onChange={set("years_experience")} /></Field>
          </>
        ) : (
          <>
            <Field label="Registration number"><input className={inputClass} value={fields.number ?? ""} onChange={set("number")} placeholder="MP09AB1234" autoFocus /></Field>
            <Field label="Type"><input className={inputClass} value={fields.kind ?? ""} onChange={set("kind")} placeholder="AC Sedan, Innova, Tempo Traveller" /></Field>
            <Field label="Seats"><input className={inputClass} type="number" min={1} value={fields.capacity ?? ""} onChange={set("capacity")} /></Field>
            <Field label="Operator (optional)"><input className={inputClass} value={fields.operator_name ?? ""} onChange={set("operator_name")} /></Field>
          </>
        )}
        {problem && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-inset ring-rose-200" role="alert">{problem}</p>}
      </Modal>

      <Modal open={!!pin} title="New portal PIN" onClose={() => setPin(null)} footer={<Button variant="primary" onClick={() => setPin(null)}>Done</Button>}>
        {pin && (
          <>
            <p className="text-sm text-slate-600">Share this PIN with {pin.name} privately. It is shown only once.</p>
            <p className="rounded-lg bg-slate-100 py-4 text-center font-mono text-3xl font-semibold tracking-[0.4em] text-slate-900">{pin.pin}</p>
          </>
        )}
      </Modal>
    </>
  );
}
