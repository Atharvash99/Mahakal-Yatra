#!/usr/bin/env bash
# Build step for Render/Railway: install, collect static files, migrate.
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
python manage.py setup_roles
