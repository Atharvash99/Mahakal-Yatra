# MahakalYatra: project notes for Claude

Read `docs/PLAN.md` (the founder's plan) first, then `README.md` (run, deploy, operations notes).
The user is a developer who owns the technical build; focus on development and use clearly marked placeholders for business content.

## Layout
- `web/`: Next.js 16 (route groups: `(site)` public pages with header/footer, `(staff)/staff` portal with its own layout; App Router, `cacheComponents` on, Tailwind 4). Read `web/node_modules/next/dist/docs/` before writing Next code; APIs differ from older versions. Server data goes through `"use cache"` functions in `src/lib/catalog.ts`; reading `searchParams` needs a `<Suspense>` boundary.
- `api/`: Django 6 + DRF. Apps: `core` (audit log, roles), `customers` (enquiries), `catalog` (packages, add-ons, coupons, festival departures, pricing), `bookings` (state machine, payments, refunds), `operations` (drivers, vehicles, assignments), `notifications`, `reviews`, `finance`, `driver` (PWA API).
- Modules talk through each app's `services.py`, not each other's tables.

## Conventions and decisions
- Prices are INR, tax-inclusive; the quote is always computed server-side (`catalog/services.quote`). Booking freezes the breakdown.
- All booking status changes go through `bookings/services.py` (`TRANSITIONS`); payment confirmation is idempotent (`WebhookEvent`).
- Cancellation policy is a JSON data object on the package and is snapshotted on each booking.
- Never promise guaranteed Bhasma Aarti, VIP darshan or temple tickets (copy, bot and guides all say so).
- Don't put personal data in URLs; the my-bookings lookup needs reference + phone.
- Git identity: `Atharvash99 <s.atharva30901@gmail.com>`. Never use the Claude account email.

## State (as of last session)
Done: landing site, package pages, inclusion/exclusion bot (rule-based, reads package data), enquiry form, booking flow with live quote, add-ons and coupons, my-bookings with driver card, festival calendar, reviews, driver PWA, finance report, staff operations dashboard (React portal at `/staff`, API in `api/staff/`: dashboard, bookings list and detail, assign/cancel/complete/driver card, refunds, drivers and vehicles, enquiries, finance; role-based, audit-logged; Django admin kept for packages, add-ons, coupons), SEO guides + sitemap + JSON-LD, env-driven settings, Render blueprint. 37 backend tests (`python manage.py test` in `api/`).

Placeholders: package prices and costs, add-on prices, coupon `YATRA5`, 5% GST, WhatsApp number (`NEXT_PUBLIC_WHATSAPP_NUMBER`), no photos (SVG art only).

Not connected or not tested: Razorpay live path (mock gateway is default), WhatsApp/SMS/email delivery (`notifications/services._deliver` only logs), no deployment yet.

## Next candidates
Vendor portal; referrals; blog CMS; analytics (GA4/Meta Pixel/PostHog); real photos; corporate/bulk enquiry flow; Hindi language toggle.
