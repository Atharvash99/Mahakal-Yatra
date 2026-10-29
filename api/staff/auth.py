import functools

from django.contrib.auth import get_user_model
from django.core import signing
from rest_framework.response import Response

SALT = 'staff-portal'
TOKEN_MAX_AGE = 60 * 60 * 12

# what the portal UI may show, as {capability: Django permission}
CAPABILITIES = {
    'bookings': 'bookings.view_booking',
    'manage_bookings': 'bookings.change_booking',
    'assign': 'operations.add_assignment',
    'refunds': 'bookings.view_refund',
    'process_refunds': 'bookings.change_refund',
    'fleet': 'operations.view_driver',
    'manage_fleet': 'operations.change_driver',
    'enquiries': 'customers.view_enquiry',
    'manage_enquiries': 'customers.change_enquiry',
    'finance': 'finance.view_payable',
}


def issue_token(user) -> str:
    # the password-hash tail makes a password change sign every old token out
    return signing.dumps({'u': user.pk, 'v': user.password[-12:]}, salt=SALT)


def current_user(request):
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    try:
        data = signing.loads(header[7:], salt=SALT, max_age=TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
    user = get_user_model().objects.filter(pk=data.get('u'), is_active=True, is_staff=True).first()
    if not user or user.password[-12:] != data.get('v'):
        return None
    return user


def role_label(user) -> str:
    if user.is_superuser:
        return 'Owner'
    group = user.groups.order_by('name').first()
    return group.name if group else 'Staff'


def capabilities(user) -> dict:
    return {name: user.has_perm(perm) for name, perm in CAPABILITIES.items()}


def staff_required(*perms):
    """Use under @api_view: 401 without a valid token, 403 without every listed permission."""
    def deco(fn):
        @functools.wraps(fn)
        def wrapper(request, *args, **kwargs):
            user = current_user(request)
            if not user:
                return Response({'detail': 'Please sign in.'}, status=401)
            if any(not user.has_perm(p) for p in perms):
                return Response({'detail': 'You do not have permission to do this.'}, status=403)
            request.staff = user
            return fn(request, *args, **kwargs)
        return wrapper
    return deco
