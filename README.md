# MahakalYatra

Ujjain and Omkareshwar travel platform: a Next.js website (`web/`) and a Django API with admin (`api/`).
One modular monolith per the plan; modules talk through service functions, never each other's tables.

## Run locally

```bash
# API (http://localhost:8000, admin at /admin)
cd api
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python manage.py migrate
.venv\Scripts\python manage.py seed_catalog     # placeholder packages, add-ons, coupon YATRA5
.venv\Scripts\python manage.py setup_roles      # Operations manager, Support agent, Accountant
.venv\Scripts\python manage.py createsuperuser  # the Owner
.venv\Scripts\python manage.py runserver

# Website (http://localhost:3000)
cd web
cp .env.example .env.local
npm install
npm run dev
```

Run the backend tests with `python manage.py test` inside `api/`.

## What is where

| Area | Backend app | Website |
| --- | --- | --- |
| Packages, add-ons, coupons, festival dates | `catalog` | `/`, `/packages/[slug]` |
| Booking, payments, refunds | `bookings` | `/book/[slug]`, `/my-bookings` |
| Enquiries | `customers` | `/enquiry` |
| Drivers, vehicles, assignments | `operations` | driver card on `/my-bookings` |
| Driver portal (PWA) | `driver` | `/driver` |
| Reviews | `reviews` | `/review`, shown on pages |
| Payables and margin report | `finance` | admin: Finance > Payables > Finance report |
| WhatsApp/SMS/email log | `notifications` | none |
| Staff roles and audit log | `core` | admin |

## Operations notes

- Set a driver's portal PIN: Admin > Drivers > action "Generate a new portal PIN".
- Send tomorrow's driver cards nightly: `python manage.py send_driver_cards` (schedule at about 8 PM).
- Real WhatsApp delivery is not connected yet: messages are written to Notifications with `delivered=False`.
  Implement `_deliver` in `api/notifications/services.py` with your provider.
- Payments run on a mock gateway by default. Set `PAYMENT_GATEWAY=razorpay` and the Razorpay keys, then point the
  Razorpay webhook (`payment.captured`) at `/api/webhooks/payment/`. The Razorpay path has not been tested against the live API.
- Prices, supplier costs and the 5% GST in `GST_PERCENT` are placeholders. Confirm with suppliers and a CA.

## Deploy

- API and database: Render blueprint in `render.yaml` (PostgreSQL via `DATABASE_URL`). See `api/.env.example`.
- Website: Vercel, root directory `web`. Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`.
