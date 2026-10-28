from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

# role -> {app_label.model: [actions]}; the Owner is a Django superuser.
ROLES = {
    'Operations manager': {
        'bookings.booking': ['view', 'change'],
        'bookings.traveller': ['view', 'change'],
        'operations.driver': ['add', 'view', 'change'],
        'operations.vehicle': ['add', 'view', 'change'],
        'operations.assignment': ['add', 'view', 'change', 'delete'],
        'catalog.packagedeparture': ['add', 'view', 'change'],
        'customers.enquiry': ['view', 'change'],
    },
    'Support agent': {
        'bookings.booking': ['view', 'change'],
        'customers.enquiry': ['view', 'change'],
        'catalog.package': ['view'],
        'reviews.review': ['view', 'change'],
    },
    'Accountant': {
        'bookings.booking': ['view'],
        'bookings.payment': ['view', 'change'],
        'bookings.refund': ['view', 'change'],
        'finance.payable': ['add', 'view', 'change'],
    },
}


class Command(BaseCommand):
    help = 'Create admin role groups with the permissions from the plan.'

    def handle(self, *args, **options):
        for role, models in ROLES.items():
            group, _ = Group.objects.get_or_create(name=role)
            perms = []
            for label, actions in models.items():
                app, model = label.split('.')
                for action in actions:
                    perms.append(Permission.objects.get(
                        content_type__app_label=app, codename=f'{action}_{model}'))
            group.permissions.set(perms)
            self.stdout.write(f'{role}: {len(perms)} permissions')
