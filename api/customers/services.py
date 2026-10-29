from .models import Enquiry


def list_enquiries(*, status: str = '', q: str = '', limit: int = 50):
    from django.db.models import Q
    qs = Enquiry.objects.all()
    if status:
        qs = qs.filter(status=status)
    q = q.strip()
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(phone__icontains=q))
    return list(qs[:limit])


def new_enquiry_count() -> int:
    return Enquiry.objects.filter(status=Enquiry.Status.NEW).count()


def get_enquiry(pk) -> Enquiry | None:
    return Enquiry.objects.filter(pk=pk).first()


def update_enquiry(enquiry: Enquiry, *, status=None, internal_notes=None) -> dict:
    """Returns the changed fields, for the audit log."""
    changes = {}
    if status is not None and status != enquiry.status:
        if status not in Enquiry.Status.values:
            raise ValueError('Unknown enquiry status.')
        changes['status'] = status
        enquiry.status = status
    if internal_notes is not None and internal_notes != enquiry.internal_notes:
        changes['internal_notes'] = internal_notes[:2000]
        enquiry.internal_notes = internal_notes[:2000]
    if changes:
        enquiry.save(update_fields=list(changes))
    return changes
