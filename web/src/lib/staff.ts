import { API } from "@/lib/api";

export const STAFF_TOKEN_KEY = "mahakalyatra.staff";

export type Capabilities = {
  bookings: boolean;
  manage_bookings: boolean;
  assign: boolean;
  refunds: boolean;
  process_refunds: boolean;
  fleet: boolean;
  manage_fleet: boolean;
  enquiries: boolean;
  manage_enquiries: boolean;
  finance: boolean;
};

export type StaffUser = { name: string; username: string; role: string; can: Capabilities };

export type BookingStatus =
  | "enquiry" | "pending_payment" | "confirmed" | "assigned" | "completed" | "cancelled" | "refunded";

export type BookingRow = {
  ref: string; status: BookingStatus; status_label: string; customer_name: string; phone: string;
  package_name: string; travel_date: string; travellers: number; pickup_point: string;
  total: number; paid: number; balance: number;
  driver: string | null; vehicle: string | null; pickup_time: string | null;
};

export type Assignment = {
  id: number;
  driver: { id: number; name: string; phone: string };
  vehicle: { id: number; number: string; kind: string };
  pickup_time: string | null; notes: string; driver_card_sent_at: string | null;
  started_at: string | null; completed_at: string | null; cash_collected: number;
};

export type Refund = {
  id: number; booking_ref: string; customer_name: string; amount: number; percent: number;
  reason: string; status: "pending" | "processed"; created_at: string;
};

export type BookingDetail = BookingRow & {
  email: string; special_requests: string; festival_label: string; created_at: string;
  travellers_list: { name: string; age: number | null; needs_wheelchair: boolean }[];
  price: {
    unit: number; addons: { slug: string; name: string; amount: number }[]; addons_total: number;
    discount: number; coupon: string; tax: number; total: number; advance: number; paid: number; balance: number;
    cost?: number; margin?: number;
  };
  payments: { id: number; kind: string; amount: number; provider: string; status: string; paid_at: string | null }[];
  refunds: Refund[];
  cancellation_policy: { hours_before: number; refund_percent: number }[];
  assignment: Assignment | null;
  actions: { assign: boolean; cancel: boolean; complete: boolean; driver_card: boolean };
};

export type Driver = {
  id: number; name: string; phone: string; rating: string; years_experience: number; active: boolean; has_pin: boolean;
};
export type Vehicle = { id: number; number: string; kind: string; capacity: number; operator_name: string; active: boolean };

export type Enquiry = {
  id: number; name: string; phone: string; email: string; package_slug: string; travel_date: string | null;
  travellers: number; pickup_point: string; message: string; status: "new" | "contacted" | "converted" | "lost";
  status_label: string; internal_notes: string; created_at: string;
};

export type Overview = {
  today: string;
  status_counts: Partial<Record<BookingStatus, number>>;
  trips_today: BookingRow[];
  unassigned: BookingRow[];
  pending_refunds: Refund[];
  new_enquiries: number;
  finance_30d?: { bookings: number; revenue: number; margin: number; margin_percent: number };
};

export type FinanceReport = {
  start: string; end: string; bookings: number; revenue: number; tax: number; cost: number; margin: number;
  margin_percent: number; refunds_total: number; refunds_pending: number; payables_outstanding: number;
  by_package: { package_name: string; bookings: number; revenue: number; margin: number }[];
};

export type CallResult<T> = { ok: boolean; status: number; data: T & { detail?: string } };

export async function staffCall<T>(path: string, token: string | null, body?: unknown, method?: string): Promise<CallResult<T>> {
  try {
    const res = await fetch(`${API}/api/staff${path}`, {
      method: method ?? (body === undefined ? "GET" : "POST"),
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, status: 0, data: { detail: "No connection to the server. Check your network and try again." } as T & { detail?: string } };
  }
}

export const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending_payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "assigned", label: "Driver assigned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

export const shortDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export const longDate = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });

export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const clock = (hhmm: string | null) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
