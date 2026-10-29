"use client";

import { useState } from "react";
import type { BookingRow, Driver, Vehicle } from "@/lib/staff";
import { useStaff } from "./StaffProvider";
import { useFetch } from "./useFetch";
import { Button, Field, Modal, inputClass, useToast } from "./ui";

type Fleet = { drivers: Driver[]; vehicles: Vehicle[] };
type Target = Pick<BookingRow, "ref" | "customer_name" | "travellers" | "pickup_time">;

export default function AssignModal({ booking, onClose, onDone }: { booking: Target | null; onClose: () => void; onDone: () => void }) {
  const { call } = useStaff();
  const toast = useToast();
  const { data: fleet, error } = useFetch<Fleet>(booking ? "/fleet/" : null);
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");

  const drivers = fleet?.drivers.filter((d) => d.active) ?? [];
  const vehicles = fleet?.vehicles.filter((v) => v.active) ?? [];

  async function submit() {
    if (!booking) return;
    setBusy(true);
    setProblem("");
    const r = await call(`/bookings/${booking.ref}/assign/`, { driver, vehicle, pickup_time: time || null });
    setBusy(false);
    if (!r.ok) { setProblem(r.data.detail ?? "Could not assign."); return; }
    toast("ok", `${booking.ref} assigned.`);
    setDriver(""); setVehicle(""); setTime("");
    onDone();
    onClose();
  }

  return (
    <Modal
      open={!!booking}
      title={booking ? `Assign driver to ${booking.ref}` : "Assign driver"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} disabled={!driver || !vehicle} onClick={submit}>Assign</Button>
        </>
      }
    >
      {booking && <p className="text-sm text-slate-600">{booking.customer_name} · {booking.travellers} travellers</p>}
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <Field label="Driver">
        <select className={inputClass} value={driver} onChange={(e) => setDriver(e.target.value)}>
          <option value="">Select a driver</option>
          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name} (★ {d.rating})</option>)}
        </select>
      </Field>
      <Field label="Vehicle">
        <select className={inputClass} value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
          <option value="">Select a vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id} disabled={booking ? v.capacity < booking.travellers : false}>
              {v.kind} {v.number} · {v.capacity} seats{booking && v.capacity < booking.travellers ? " (too small)" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Pickup time" hint="Optional. Shown on the driver card.">
        <input className={inputClass} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </Field>
      {problem && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-inset ring-rose-200" role="alert">{problem}</p>}
    </Modal>
  );
}
