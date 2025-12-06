#!/usr/bin/env sh
# Fallback start script for Railpack: instala dependencias del backend y arranca la app
set -e
echo "Starting fallback start.sh: installing backend deps and launching gunicorn"
cd backend
if [ -f requirements.txt ]; then
  pip install --upgrade pip
  pip install --no-cache-dir -r requirements.txt
fi
echo "Launching gunicorn..."
exec gunicorn run:app --bind 0.0.0.0:${PORT:-5000} --workers 2
