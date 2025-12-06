# Despliegue del backend en Railway

Este servicio Flask se inicia con gunicorn usando `run.py` que expone la variable `app`.

Archivos añadidos para facilitar despliegue en Railway:

- `Procfile` — comando de arranque: `web: gunicorn run:app --bind 0.0.0.0:$PORT`
- `runtime.txt` — versión de Python: `python-3.11.5`

## Pasos después del push

1. En Railway, en el servicio correspondiente, configura la "Root Directory" a `backend/` si no está ya.
2. Forza redeploy desde la UI de Railway o espera el webhook. Railway instalará `requirements.txt` y ejecutará el comando del `Procfile`.
3. Revisa logs de build si falla y compártelos para depuración.

## Variables de entorno recomendadas

Crea las siguientes variables en Railway → Service → Variables:
- `SECRET_KEY` (cadena larga y secreta)
- `FLASK_ENV=production`
- `FLASK_DEBUG=0`
- `DATABASE_URL` (URL de tu base de datos, la provee Railway si usas el plugin de DB)

Puedes ver un ejemplo en `.env.example`.

## Migraciones de base de datos

Si usas base de datos y tienes modelos/migraciones, ejecuta:
1. Abre la consola del servicio en Railway (Run → Shell).
2. Ejecuta:
	```bash
	export FLASK_APP=run.py
	export FLASK_ENV=production
	flask db upgrade
	```
	O alternativamente:
	```bash
	python -m flask db upgrade
	```

## Notas
- `gunicorn` ya está en `backend/requirements.txt`.
- Si prefieres usar otra versión de Python, edita `runtime.txt`.
