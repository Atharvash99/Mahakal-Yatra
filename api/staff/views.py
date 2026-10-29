from datetime import date, time, timedelta

from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from bookings import services as bookings
from core.services import log_action
from customers import services as customers
from finance import services as finance
from operations import services as operations

from . import serializers as s
from .auth import capabilities, issue_token, role_label, staff_required


class LoginThrottle(AnonRateThrottle):
    rate = '20/hour'


def _bad(detail, status=400):
    return Response({'detail': detail}, status=status)


def _date(value):
    try:
        return date.fromisoformat(value or '')
    except ValueError:
        return None


def _int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _me(user) -> dict:
    return {'name': user.get_full_name() or user.get_username(), 'username': user.get_username(),
            'role': role_label(user), 'can': capabilities(user)}


@api_view(['POST'])
@throttle_classes([LoginThrottle])
def login(request):
    user = authenticate(username=request.data.get('username') or '', password=request.data.get('password') or '')
    if not user or not user.is_staff:
        return _bad('Wrong username or password.', 401)
    return Response({'token': issue_token(user), 'me': _me(user)})


@api_view(['GET'])
@staff_required()
def me(request):
    return Response(_me(request.staff))


@api_view(['GET'])
@staff_required('bookings.view_booking')
def overview(request):
    today = date.today()
    o = bookings.staff_overview(today)
    refs = [b.ref for b in o['trips_today']]
    assigned = operations.assignments_by_ref(refs)
    can = capabilities(request.staff)
    out = {
        'today': today.isoformat(),
        'status_counts': bookings.status_counts(),
        'trips_today': [s.booking_row(b, assigned.get(b.ref)) for b in o['trips_today']],
        'unassigned': [s.booking_row(b) for b in o['unassigned']],
        'pending_refunds': [s.refund_json(r) for r in o['pending_refunds']] if can['refunds'] else [],
        'new_enquiries': customers.new_enquiry_count() if can['enquiries'] else 0,
    }
    if can['finance']:
        f = finance.summary(today, today + timedelta(days=30))
        out['finance_30d'] = {k: f[k] for k in ('bookings', 'revenue', 'margin', 'margin_percent')}
    return Response(out)


@api_view(['GET'])
@staff_required('bookings.view_booking')
def booking_list(request):
    limit = max(1, min(100, _int(request.GET.get('limit'), 25)))
    offset = max(0, _int(request.GET.get('offset'), 0))
    rows, total = bookings.search(
        q=request.GET.get('q', ''), status=request.GET.get('status', ''),
        date_from=_date(request.GET.get('from')), date_to=_date(request.GET.get('to')),
        limit=limit, offset=offset)
    assigned = operations.assignments_by_ref(b.ref for b in rows)
    return Response({'total': total, 'results': [s.booking_row(b, assigned.get(b.ref)) for b in rows]})


def _booking_payload(user, ref):
    b = bookings.detail(ref)
    if not b:
        return None
    a = operations.assignments_by_ref([ref]).get(ref)
    return s.booking_detail(b, a, show_margin=user.has_perm('finance.view_payable'))


@api_view(['GET'])
@staff_required('bookings.view_booking')
def booking_detail(request, ref):
    data = _booking_payload(request.staff, ref)
    return Response(data) if data else _bad('Booking not found.', 404)


@api_view(['POST'])
@staff_required('operations.add_assignment')
def booking_assign(request, ref):
    if not bookings.get_by_ref(ref):
        return _bad('Booking not found.', 404)
    driver = operations.get_driver(request.data.get('driver'))
    vehicle = operations.get_vehicle(request.data.get('vehicle'))
    if not driver or not vehicle:
        return _bad('Pick a driver and a vehicle.')
    pickup = None
    if request.data.get('pickup_time'):
        try:
            pickup = time.fromisoformat(request.data['pickup_time'])
        except ValueError:
            return _bad('Pickup time is not valid.')
    try:
        a = operations.assign(ref, driver, vehicle, pickup)
    except bookings.BookingError as e:
        return _bad(str(e))
    log_action(request.staff, 'create', a._meta.label, a.pk, str(a), {'via': 'staff portal'})
    return Response(_booking_payload(request.staff, ref))


@api_view(['POST'])
@staff_required('bookings.change_booking')
def booking_cancel(request, ref):
    b = bookings.get_by_ref(ref)
    if not b:
        return _bad('Booking not found.', 404)
    try:
        refund = bookings.cancel_booking(b)
    except bookings.BookingError as e:
        return _bad(str(e))
    log_action(request.staff, 'update', b._meta.label, b.pk, f'{b.ref} cancelled',
               {'status': 'cancelled', 'refund': refund.amount if refund else 0})
    return Response(_booking_payload(request.staff, ref))


@api_view(['POST'])
@staff_required('bookings.change_booking')
def booking_complete(request, ref):
    b = bookings.get_by_ref(ref)
    if not b:
        return _bad('Booking not found.', 404)
    try:
        bookings.mark_completed(b)
    except bookings.BookingError as e:
        return _bad(str(e))
    log_action(request.staff, 'update', b._meta.label, b.pk, f'{b.ref} completed', {'status': 'completed'})
    return Response(_booking_payload(request.staff, ref))


@api_view(['POST'])
@staff_required('bookings.change_booking')
def booking_driver_card(request, ref):
    b = bookings.get_by_ref(ref)
    if not b:
        return _bad('Booking not found.', 404)
    if not operations.send_driver_card(b):
        return _bad('No driver is assigned yet.')
    log_action(request.staff, 'update', b._meta.label, b.pk, f'{b.ref} driver card sent', {'driver_card': 'sent'})
    return Response(_booking_payload(request.staff, ref))


@api_view(['GET'])
@staff_required('bookings.view_refund')
def refund_list(request):
    return Response({'results': [s.refund_json(r) for r in bookings.list_refunds(request.GET.get('status', ''))]})


@api_view(['POST'])
@staff_required('bookings.change_refund')
def refund_process(request, refund_id):
    r = bookings.get_refund(refund_id)
    if not r:
        return _bad('Refund not found.', 404)
    if r.status != 'pending':
        return _bad('This refund is already processed.')
    bookings.mark_refund_processed(r)
    log_action(request.staff, 'update', r._meta.label, r.pk, str(r), {'status': 'processed'})
    return Response(s.refund_json(bookings.get_refund(refund_id)))


@api_view(['GET'])
@staff_required('operations.view_driver')
def fleet(request):
    f = operations.fleet()
    return Response({'drivers': [s.driver_json(d) for d in f['drivers']],
                     'vehicles': [s.vehicle_json(v) for v in f['vehicles']]})


@api_view(['POST'])
@staff_required('operations.add_driver')
def driver_create(request):
    try:
        d = operations.create_driver(name=request.data.get('name') or '', phone=request.data.get('phone') or '',
                                     years_experience=_int(request.data.get('years_experience'), 1))
    except operations.OperationsError as e:
        return _bad(str(e))
    log_action(request.staff, 'create', d._meta.label, d.pk, str(d), {'via': 'staff portal'})
    return Response(s.driver_json(d), status=201)


@api_view(['POST'])
@staff_required('operations.add_vehicle')
def vehicle_create(request):
    try:
        v = operations.create_vehicle(
            number=request.data.get('number') or '', kind=request.data.get('kind') or '',
            capacity=_int(request.data.get('capacity'), 0), operator_name=request.data.get('operator_name') or '')
    except operations.OperationsError as e:
        return _bad(str(e))
    log_action(request.staff, 'create', v._meta.label, v.pk, str(v), {'via': 'staff portal'})
    return Response(s.vehicle_json(v), status=201)


@api_view(['POST'])
@staff_required('operations.change_driver')
def driver_active(request, driver_id):
    d = operations.get_driver(driver_id)
    if not d:
        return _bad('Driver not found.', 404)
    operations.set_active(d, bool(request.data.get('active')))
    log_action(request.staff, 'update', d._meta.label, d.pk, str(d), {'active': d.active})
    return Response(s.driver_json(d))


@api_view(['POST'])
@staff_required('operations.change_vehicle')
def vehicle_active(request, vehicle_id):
    v = operations.get_vehicle(vehicle_id)
    if not v:
        return _bad('Vehicle not found.', 404)
    operations.set_active(v, bool(request.data.get('active')))
    log_action(request.staff, 'update', v._meta.label, v.pk, str(v), {'active': v.active})
    return Response(s.vehicle_json(v))


@api_view(['POST'])
@staff_required('operations.change_driver')
def driver_reset_pin(request, driver_id):
    d = operations.get_driver(driver_id)
    if not d:
        return _bad('Driver not found.', 404)
    pin = operations.reset_driver_pin(d)
    log_action(request.staff, 'update', d._meta.label, d.pk, f'{d} portal PIN reset', {'pin': 'reset'})
    return Response({'pin': pin, 'driver': s.driver_json(d)})


@api_view(['GET'])
@staff_required('customers.view_enquiry')
def enquiry_list(request):
    rows = customers.list_enquiries(status=request.GET.get('status', ''), q=request.GET.get('q', ''))
    return Response({'results': [s.enquiry_json(e) for e in rows]})


@api_view(['POST'])
@staff_required('customers.change_enquiry')
def enquiry_update(request, enquiry_id):
    e = customers.get_enquiry(enquiry_id)
    if not e:
        return _bad('Enquiry not found.', 404)
    try:
        changes = customers.update_enquiry(
            e, status=request.data.get('status'), internal_notes=request.data.get('internal_notes'))
    except ValueError as err:
        return _bad(str(err))
    if changes:
        log_action(request.staff, 'update', e._meta.label, e.pk, str(e), changes)
    return Response(s.enquiry_json(e))


@api_view(['GET'])
@staff_required('finance.view_payable')
def finance_report(request):
    today = date.today()
    start = _date(request.GET.get('start')) or today.replace(day=1)
    end = _date(request.GET.get('end')) or today + timedelta(days=60)
    if end < start:
        return _bad('End date must be after the start date.')
    f = finance.summary(start, end)
    f['start'], f['end'] = start.isoformat(), end.isoformat()
    return Response(f)
