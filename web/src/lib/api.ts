export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Quote = {
  package: string;
  travel_date: string;
  travellers: number;
  unit_price: number;
  base: number;
  addons: { slug: string; name: string; amount: number }[];
  addons_total: number;
  coupon_code: string;
  discount: number;
  total: number;
  tax: number;
  advance: number;
  balance: number;
  advance_percent: number;
  festival_label: string;
  seats_left: number | null;
};

export type DriverCard = {
  driver_name: string;
  driver_phone: string;
  rating: string;
  years_experience: number;
  vehicle: string;
  vehicle_number: string;
  pickup_time: string | null;
};

export type Booking = {
  ref: string;
  status: "enquiry" | "pending_payment" | "confirmed" | "assigned" | "completed" | "cancelled" | "refunded";
  status_label: string;
  package_slug: string;
  package_name: string;
  travel_date: string;
  travellers: number;
  customer_name: string;
  pickup_point: string;
  festival_label: string;
  price: {
    unit: number; total: number; tax: number; advance: number; paid: number; balance_due: number;
    addons: { slug: string; name: string; amount: number }[]; addons_total: number; discount: number; coupon: string;
  };
  cancellation_policy: { hours_before: number; refund_percent: number }[];
  refunds: { amount: number; percent: number; status: string }[];
  driver_card: DriverCard | null;
};

export type PaymentOrder = {
  gateway: "mock" | "razorpay";
  order_id: string;
  amount: number;
  kind: "advance" | "balance";
  public: { key?: string };
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string[]> };

export async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: json as T };
    if (res.status === 429) return { ok: false, error: "Too many attempts. Please try again in a while." };
    if (json.detail) return { ok: false, error: String(json.detail) };
    return { ok: false, error: "Please check the highlighted fields.", fields: json };
  } catch {
    return { ok: false, error: "Could not reach the server. Please try again or WhatsApp us." };
  }
}

export async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}/api${path}`);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Opens Razorpay Checkout. Untested until live keys are configured. */
export function openRazorpay(order: PaymentOrder, name: string, onDone: () => void) {
  const start = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Rz = (window as any).Razorpay;
    new Rz({
      key: order.public.key,
      order_id: order.order_id,
      amount: order.amount * 100,
      currency: "INR",
      name: "MahakalYatra",
      prefill: { name },
      // the webhook confirms the payment; the page just re-checks the booking
      handler: onDone,
    }).open();
  };
  if (document.getElementById("rzp-script")) return start();
  const s = document.createElement("script");
  s.id = "rzp-script";
  s.src = "https://checkout.razorpay.com/v1/checkout.js";
  s.onload = start;
  document.body.appendChild(s);
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const niceDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

const KEY = "mahakalyatra.booking";
export function rememberBooking(ref: string, phone: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ref, phone }));
  } catch {}
}
export function recallBooking(): { ref: string; phone: string } | null {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}
