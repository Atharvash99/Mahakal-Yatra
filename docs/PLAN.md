# MahakalYatra: Ujjain & Omkareshwar Travel Platform Plan

Source: the founder's plan document (Oct 27, 2026, @Atharva Sharma), copied here so it travels with the repo.

## 1. Overview and positioning
Build the most reliable and transparent way to visit Ujjain and Omkareshwar, starting as a small pilgrimage tour operator and growing into a booking platform. A travel platform here wins on operations and trust, not software, so technology stays thin until bookings are consistent.

Do not compete with MakeMyTrip. Own one narrow thing: Ujjain + Omkareshwar done reliably.

Competitors are weak on: clear fixed pricing, a named driver and vehicle shared before the trip, live trip support, Mahakal Bhasma Aarti guidance, and reviews people can trust.

Target customers: families and elderly pilgrims, group yatra organisers (Gujarat, Maharashtra, Rajasthan), Indore arrivals by air or rail, corporate groups.

Brand: MahakalYatra (strong for SEO and recall).

## 2. Services, packages and revenue
Launch with 3-4 packages and one standalone transfer product, using partner vehicles and hotels (no owned assets). Every package page must state inclusions, exclusions, duration, pickup point, cancellation terms and final price.

| Package | Duration | Notes |
| --- | --- | --- |
| Ujjain temple circuit | 1 day | Mahakaleshwar, Kal Bhairav, Harsiddhi, Ram Ghat, Sandipani Ashram, Mangalnath |
| Omkareshwar trip | 1 day | From Indore or Ujjain |
| Ujjain + Omkareshwar | 2 days | Flagship package |
| Indore airport/railway pickup and drop | Transfer | Standalone and add-on product |
| Optional hotel, private cab, guide | Add-on | Sold with any package |

Revenue: margin on package cost; commission from hotels/transport partners where agreed; add-ons (private cabs, hotels, puja, guide, photo/video); later, commission on verified vendors. Example only: a Rs 12,000 package with Rs 9,000 variable cost leaves Rs 3,000 before ads, salaries, taxes, overheads. Real rates must be confirmed with suppliers.

## 3. Product ideas and differentiators
1. Bhasma Aarti assistance: guidance and registration help only. The temple committee runs permissions, so never promise guaranteed access.
2. Fixed-price, all-inclusive packages with a visible includes/excludes panel.
3. Driver card: name, photo, vehicle number, rating, sent on WhatsApp the night before.
4. Festival calendar: Mahashivratri, Shravan Somvar, Kartik Purnima, Simhastha 2028, with advance booking and dynamic pricing.
5. Family and elderly-friendly itineraries: wheelchair information, vegetarian meal stops.
6. Add-ons: hotel/dharamshala, puja booking, Hindi-speaking guide, photo and video, prasad delivery.
7. Corporate and bulk bookings for yatra organisers and groups.

Later: vendor marketplace (verified cabs, hotels, guides, commission); more destinations (Maheshwar, Mandu, Indore city tours, then Nashik, Trimbakeshwar, Somnath); loyalty and referral credits.

## 4. Portals
Four portals on one backend (API + database); WhatsApp is a fifth channel.

| # | Portal | Users | Built when | Has |
| --- | --- | --- | --- | --- |
| 1 | Customer website | Travellers | MVP (weeks 5-8) | Packages, date and traveller selection, booking and payment, my bookings, support, reviews |
| 2 | Admin panel | Our team | MVP (weeks 5-8) | Packages and prices, bookings, customers, driver assignment, payments and refunds, suppliers, reports |
| 3 | Driver portal (mobile web/PWA) | Drivers | Phase 3 (weeks 9-12) | Today's trips, pickup details, customer phone, start/complete trip, notes |
| 4 | Vendor portal | Hotels, cab operators, guides | Phase 5 (6+ months) | Own rates and availability, assigned bookings, commission statements |

Admin roles (one portal, role-based): Owner/super admin (everything incl. reports and finance); Operations manager (bookings, assignments, drivers); Support agent (queries, booking changes); Accountant (payments, refunds, supplier payables).

Add the driver portal once there are more than 2-3 trips a day; the vendor portal only when supplier coordination takes too much time.

## 5. Modules
7 modules for the MVP, about 14 over time, all in one codebase as separate apps/folders.

| # | Module | What it does | When |
| --- | --- | --- | --- |
| 1 | Catalog | Packages, itineraries, inclusions/exclusions, photos, prices, departures | MVP |
| 2 | Booking | Date and traveller selection, booking states, price breakdown | MVP |
| 3 | Payments | Razorpay or Cashfree, advance plus balance, webhooks, refunds | MVP |
| 4 | Customers | Traveller profiles, enquiries and leads | MVP |
| 5 | Operations | Vehicle and driver assignment, daily trip sheet, pickup details | MVP |
| 6 | Notifications | WhatsApp, SMS, email confirmations and reminders | MVP |
| 7 | Admin and auth | Staff login and roles, admin panel, audit log | MVP |
| 8 | Driver PWA | Trip view, start and complete, customer contact | Phase 3 |
| 9 | Reviews and feedback | Post-trip ratings, Google review link | Phase 3 |
| 10 | Finance | Supplier payables, margin reports, cancellation and refund ledger | Phase 3 |
| 11 | Vendor portal | Hotels and operators set rates and availability | Growth |
| 12 | Commission and payouts | Automated vendor settlements | Growth |
| 13 | Marketing | Coupons, referrals, SEO and blog CMS, campaign tracking | Growth |
| 14 | Reporting and analytics | Cost per booking, on-time %, repeat rate | Growth |

Rules: add a module only when a manual process starts to hurt. Skip early: native mobile app, chatbot, multi-city support, live GPS tracking, AI dynamic pricing. Keep boundaries clean: modules talk through functions or events and never read each other's tables.

## 6. Architecture and tech stack
Modular monolith, not microservices (one codebase and deploy; fine under about 1,000 bookings a month). Fastest MVP: Django (free admin) + Next.js public site.

Frontend Next.js + Tailwind (SEO); Backend Django (or NestJS); Database PostgreSQL; Payments Razorpay or Cashfree (UPI, cards, partial payments); Messaging WhatsApp Business API (Gupshup, Interakt or Meta Cloud); Hosting Vercel + Railway/Render or one VPS (under Rs 3-5k/month); Maps Google Maps or Mapbox; Driver app PWA not native; Analytics GA4, Meta Pixel, PostHog.

## 7. Data model and design rules
Entities: Package, PackageDeparture (date, seats, price); Booking, Traveller, Payment, Refund; Vehicle, Driver, Assignment; Vendor (hotel, cab operator), VendorRate, Payable; Review, Enquiry, Coupon.

Rules:
- Booking states: enquiry, pending payment, confirmed, assigned, completed or cancelled, refunded.
- Store the price breakdown (cost, margin, tax) with each booking.
- Payment webhooks must be idempotent (no double bookings).
- Cancellation policy is a data object, not text, so refunds can be computed.
- Keep an audit log of every manual change.
- Collect only needed data (name, phone, pickup, ID if required); comply with the DPDP Act.

## 8. Roadmap
Sell manually first, build the platform in weeks 5-8, add portals and modules only when a manual process starts to hurt (each phase has a gate signal).

## 9. Growth and marketing
1. SEO: "Ujjain Omkareshwar one day trip", "Indore to Ujjain taxi", Bhasma Aarti booking guide.
2. Google Business Profile and reviews.
3. Google Ads on search intent only.
4. Partnerships with hotels, dharamshalas, airport/station taxi desks, religious tour groups.
5. WhatsApp broadcast and referrals.
6. YouTube and Instagram Reels ("plan Ujjain in 1 day").

## 10. Risks, legal and compliance
| Risk | Handling |
| --- | --- |
| Late drivers/vehicle problems | 2-3 vetted operators per route; written rate agreements |
| Customers do not trust a new company | Driver card, reviews, clear inclusions and cancellation terms |
| Festival and holiday peaks | Advance deposits, capped inventory, higher prices |
| Cancellations and refunds hurt cash flow | Clear policy, partial advance, reserve funds |
| Large platforms have reach | Stay narrow |
| Overbuilding software | No marketplace or app before 100+ quality bookings |

Checklist (confirm with a CA or lawyer): business registration, GST, tour-operator requirements; commercial vehicle permits, insurance, verified drivers (many private cars are not permitted for paid tourist transport); written supplier rates; published inclusions/exclusions/cancellation/refund rules; trusted payment gateway and records; no promise of guaranteed VIP darshan, Bhasma Aarti or temple tickets without a valid authorised arrangement; DPDP Act data protection.

## 11. Team, budget, partner decisions
One person must own trip-day operations. Teams: Tech (website, admin, payments, automations); Ops (suppliers, drivers, trip-day control); Sales and support (WhatsApp, calls, reviews, partnerships).

Lean MVP budget (rough): Rs 40,000-2,00,000 overall. Domain/hosting/email Rs 5-10k/yr; website+admin Rs 0 if self-built; WhatsApp API+SMS Rs 1-3k/month; gateway about 2%; Google Ads test Rs 15-30k/month; branding and photos Rs 10-30k; working capital Rs 50k+.

Partner decisions open: investment per partner, ownership of tech/sales/support/ops, profit split, first packages, cab and hotel partners, target date for first paid booking.

## 12. Metrics and next steps
Track: enquiries and bookings, profit per trip, ad cost per booking, cancellations and refunds, on-time pickups and complaints, reviews and referrals, money owed to suppliers and cash available.

Next steps: (1) lock 3 packages and get written supplier rates; (2) decide stack: Django + Next.js (chosen); (3) launch landing page and WhatsApp number within 2 weeks and sell manually first; (4) build customer website and admin (weeks 5-8) once first paid bookings arrive.
