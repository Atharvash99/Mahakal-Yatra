from django.contrib import admin

from .models import AuditLog


class AuditedAdmin(admin.ModelAdmin):
    """Mixin: records who changed what from the admin panel."""

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        AuditLog.objects.create(
            actor=request.user,
            action='update' if change else 'create',
            model=obj._meta.label,
            object_id=str(obj.pk),
            summary=str(obj)[:300],
            changes={f: str(form.cleaned_data.get(f)) for f in form.changed_data},
        )

    def delete_model(self, request, obj):
        AuditLog.objects.create(
            actor=request.user, action='delete', model=obj._meta.label,
            object_id=str(obj.pk), summary=str(obj)[:300],
        )
        super().delete_model(request, obj)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'actor', 'action', 'model', 'object_id', 'summary')
    list_filter = ('action', 'model')
    search_fields = ('summary', 'object_id')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
