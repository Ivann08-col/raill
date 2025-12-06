# Despliegue del backend en Railway

Este servicio Flask se inicia con gunicorn usando `run.py` que expone la variable `app`.

Archivos añadidos para facilitar despliegue en Railway:

- `Procfile` — comando de arranque: `web: gunicorn run:app --bind 0.0.0.0:$PORT`
- `runtime.txt` — versión de Python: `python-3.11.5`

Pasos después del push:

1. En Railway, en el servicio correspondiente, configurar la "Root Directory" a `backend/` si no está ya.
2. Forzar redeploy desde la UI de Railway o esperar el webhook. Railway instalará `requirements.txt` y ejecutará el comando del `Procfile`.
3. Revisar logs de build si falla y compartirlos para depuración.

Notas:
- `gunicorn` ya está en `backend/requirements.txt`.
- Si prefieres usar otra versión de Python, edita `runtime.txt`.
