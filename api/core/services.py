from .models import AuditLog


def log_action(actor, action: str, model: str, object_id, summary: str = '', changes: dict | None = None) -> None:
    """Record a manual change made outside the Django admin (e.g. from the staff portal)."""
    AuditLog.objects.create(
        actor=actor, action=action, model=model, object_id=str(object_id),
        summary=summary[:300], changes=changes or {})
