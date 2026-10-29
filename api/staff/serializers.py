"""Plain-dict JSON for the staff portal."""


def _iso(d):
    return d.isoformat() if d else None


def _time(t):
    return t.strftime('%H:%M') if t else None


def assignment_json(a) -> dict | None:
    if not a:
        return None
    return {
        'id': a.id,
        'driver': {'id': a.driver_id, 'name': a.driver.name, 'phone': a.driver.phone},
        'vehicle': {'id': a.vehicle_id, 'number': a.vehicle.number, 'kind': a.vehicle.kind},
        'pickup_time': _time(a.pickup_time), 'notes': a.notes,
        'driver_card_sent_at': _iso(a.driver_card_sent_at),
        'started_at': _iso(a.started_at), 'completed_at': _iso(a.completed_at),
        'cash_collected': a.cash_collected,
    }


def booking_row(b, a=None) -> dict:
    return {
        'ref': b.ref, 'status': b.status, 'status_label': b.get_status_display(),
        'customer_name': b.customer_name, 'phone': b.phone,
        'package_name': b.package_name, 'travel_date': _iso(b.travel_date), 'travellers': b.num_travellers,
        'pickup_point': b.pickup_point, 'total': b.total_amount, 'paid': b.paid_amount, 'balance': b.balance_due,
        'driver': a.driver.name if a else None, 'vehicle': a.vehicle.number if a else None,
        'pickup_time': _time(a.pickup_time) if a else None,
    }


def booking_detail(b, a, *, show_margin: bool) -> dict:
    out = booking_row(b, a)
    out.update({
        'email': b.email, 'special_requests': b.special_requests, 'festival_label': b.festival_label,
        'created_at': _iso(b.created_at),
        'travellers_list': [{'name': t.name, 'age': t.age, 'needs_wheelchair': t.needs_wheelchair}
                            for t in b.travellers.all()],
        'price': {
            'unit': b.unit_price, 'addons': b.addons, 'addons_total': b.addons_amount,
            'discount': b.discount_amount, 'coupon': b.coupon_code, 'tax': b.tax_amount,
            'total': b.total_amount, 'advance': b.advance_amount, 'paid': b.paid_amount, 'balance': b.balance_due,
            **({'cost': b.cost_amount, 'margin': b.margin_amount} if show_margin else {}),
        },
        'payments': [{'id': p.id, 'kind': p.kind, 'amount': p.amount, 'provider': p.provider,
                      'status': p.status, 'paid_at': _iso(p.paid_at)} for p in b.payments.all()],
        'refunds': [refund_json(r) for r in b.refunds.all()],
        'cancellation_policy': b.cancellation_policy,
        'assignment': assignment_json(a),
        'actions': {
            'assign': b.status == 'confirmed',
            'cancel': b.status in ('enquiry', 'pending_payment', 'confirmed', 'assigned'),
            'complete': b.status == 'assigned',
            'driver_card': bool(a) and b.status == 'assigned',
        },
    })
    return out


def refund_json(r) -> dict:
    return {'id': r.id, 'booking_ref': r.booking.ref, 'customer_name': r.booking.customer_name,
            'amount': r.amount, 'percent': r.refund_percent, 'reason': r.reason,
            'status': r.status, 'created_at': _iso(r.created_at)}


def driver_json(d) -> dict:
    return {'id': d.id, 'name': d.name, 'phone': d.phone, 'rating': str(d.rating),
            'years_experience': d.years_experience, 'active': d.active, 'has_pin': bool(d.pin_hash)}


def vehicle_json(v) -> dict:
    return {'id': v.id, 'number': v.number, 'kind': v.kind, 'capacity': v.capacity,
            'operator_name': v.operator_name, 'active': v.active}


def enquiry_json(e) -> dict:
    return {'id': e.id, 'name': e.name, 'phone': e.phone, 'email': e.email, 'package_slug': e.package_slug,
            'travel_date': _iso(e.travel_date), 'travellers': e.travellers, 'pickup_point': e.pickup_point,
            'message': e.message, 'status': e.status, 'status_label': e.get_status_display(),
            'internal_notes': e.internal_notes, 'created_at': _iso(e.created_at)}
