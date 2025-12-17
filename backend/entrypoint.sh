#!/bin/bash
set -e

echo "=== Argus Backend Entrypoint ==="

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
while ! python -c "
import os
import psycopg2
try:
    conn = psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', 'postgres'),
        port=os.environ.get('POSTGRES_PORT', '5432'),
        dbname=os.environ.get('POSTGRES_DB', 'argus'),
        user=os.environ.get('POSTGRES_USER', 'argus'),
        password=os.environ.get('POSTGRES_PASSWORD', 'argus')
    )
    conn.close()
    print('PostgreSQL is ready!')
except Exception as e:
    print(f'PostgreSQL not ready: {e}')
    exit(1)
" 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done

echo "PostgreSQL is up - continuing..."

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Starting server..."
exec "$@"
