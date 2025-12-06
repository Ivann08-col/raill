# Ejecutar el backend (Synapse API)

Este documento recoge pasos detallados para preparar y ejecutar el backend en un equipo nuevo (Windows / cmd.exe). Incluye creación de entorno virtual, instalación de dependencias, preparación de la base de datos, migraciones y comandos para arrancar y diagnosticar problemas comunes.

> Fecha: 12 de noviembre de 2025

## Requisitos

- Python 3.10 o 3.11 (asegúrate que `python` y `pip` estén en PATH)
- MySQL o MariaDB (servidor de base de datos)
- Git (opcional si vas a clonar el repo)
- (Opcional) Redis si vas a usar funcionalidades que lo requieran

## Resumen de pasos

1. Clonar el repositorio (si aplica)
2. Crear y activar un virtualenv
3. Instalar dependencias
4. Crear la base de datos y usuario en MySQL/MariaDB
5. Crear `.env` con variables de entorno
6. Aplicar migraciones (Alembic / Flask-Migrate)
7. Ejecutar la aplicación

---

## 1) Clonar y posicionarse

Si ya tienes el repositorio, entra en la carpeta `backend`.

```cmd
:: ejemplo si vas a clonar
git clone <tu-repo-url> "PROYECTO_SYNAPSE"
cd "PROYECTO_SYNAPSE\backend"
```

## 2) Crear y activar entorno virtual (cmd.exe)

```cmd
python -m venv venv
venv\Scripts\activate
```

Si usas PowerShell:
```powershell
venv\Scripts\Activate.ps1
```

## 3) Instalar dependencias

```cmd
pip install --upgrade pip
pip install -r requirements.txt
```

## 4) Preparar la base de datos

Ejecuta en tu servidor MySQL/MariaDB (ajusta nombre/credenciales):

```sql
-- En el cliente mysql:
CREATE DATABASE synapse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'synapse'@'localhost' IDENTIFIED BY 'tu_password_segura';
GRANT ALL PRIVILEGES ON synapse_db.* TO 'synapse'@'localhost';
FLUSH PRIVILEGES;
```

> Nota: El proyecto por defecto en `app/config.py` usa la URI `mysql+pymysql://root:@localhost:3306/synapse_db` si no defines `DATABASE_URL`. Es recomendable crear el usuario propio (`synapse`) y usar esa URI en `.env`.

## 5) Crear `.env` (archivo de ejemplo)

Crea un archivo `backend/.env` con (rellena valores):

```
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=mysql+pymysql://synapse:tu_password_segura@localhost:3306/synapse_db
JWT_SECRET_KEY=una-clave-muy-se
SECRET_KEY=otra-clave-secreta
UPLOAD_FOLDER=uploads
```

También puedes exportar variables temporalmente en la consola con `set` (durará solo para esa sesión):

```cmd
set DATABASE_URL=mysql+pymysql://synapse:tu_password_segura@localhost:3306/synapse_db
set FLASK_ENV=development
set FLASK_DEBUG=True
set JWT_SECRET_KEY=una-clave-muy-se
```

## 6) Migraciones (Flask-Migrate / Alembic)

Si el repositorio ya tiene `migrations/` y está sincronizado con el esquema esperado, aplica:

```cmd
flask --app app:create_app db upgrade
```

Si vas a crear migraciones desde cero (BD limpia o primer despliegue):

```cmd
flask --app app:create_app db init   :: solo si NO existe la carpeta migrations
flask --app app:create_app db migrate -m "init"
flask --app app:create_app db upgrade
```

Problemas comunes:
- `Exit Code 1` en `flask db upgrade`: copia la traza completa y compártela (normalmente indica problema de conexión DB o migraciones incompatibles).
- Si la BD ya contiene tablas conflictivas y no quieres perder datos, evita `db init` + `migrate` sin revisar.

## 7) Crear carpeta de uploads

Si tu app sube archivos (avatares), crea la carpeta indicada en `.env`:

```cmd
mkdir uploads
```

## 8) Ejecutar la aplicación

Manera directa (usa `run.py`):

```cmd
python run.py
```

o con Flask CLI:

```cmd
flask --app app:create_app run
```

La API quedará disponible en `http://127.0.0.1:5000/`.

Comprobar health:

```cmd
curl http://127.0.0.1:5000/health
```

## 9) Pruebas rápidas de endpoints

- `/` — índice con lista de endpoints
- `/health` — comprobación de conexión a BD
- `/api/auth/login` — probar login (POST con JSON correo/password)

Ejemplo curl para login:

```cmd
curl -X POST http://127.0.0.1:5000/api/auth/login -H "Content-Type: application/json" -d "{\"correo\":\"tu@correo.com\",\"password\":\"tuPassword\"}"
```

## 10) Troubleshooting (errores que viste en logs)

- `pymysql.err.OperationalError (1241, 'Operand should contain 1 column(s)')`
  - Causa: se pasó una lista/array como parámetro a una consulta SQL. Ej: `{'nombre_completo': ['Valor','Valor']}`.
  - Acción: asegurarse de que el backend reciba strings escalares. Ya se aplicó una corrección en `backend/app/routes/auth.py` para normalizar valores del `request.form` y JSON.

- `GET /api/undefined?days=14 404`
  - Causa: frontend está concatenando una ruta undefined. Revisar `frontend/src/services/config` y la clave `paths.estadoAnimoHistory`.
  - Acción: si despliegas frontend, asegúrate que `cfg.paths` esté bien definido.

- `GET /api/sesiones?limit=5 500`
  - Ya añadimos trazas en `backend/app/routes/sesion_routes.py` para imprimir la traza completa cuando falle `get_sesiones`. Reinicia el servidor, reproduce la petición y copia/pega la traza aquí para diagnosticar.

## 11) Sugerencias para ejecutar mañana en otro equipo

1. Copia el proyecto (git clone o zip).
2. Asegúrate de tener Python y MySQL instalados.
3. Copia el archivo `.env` (o crea uno nuevo usando el bloque de ejemplo de arriba).
4. Crea la BD y usuario en MySQL.
5. Ejecuta el script de instalación (comandos listados) y las migraciones.

## 12) (Opcional) Script `.bat` de arranque rápido

Puedes crear un archivo `run-backend-windows.bat` en `backend/` con contenido como este (edítalo con tus rutas/credenciales):

```bat
@echo off
REM run-backend-windows.bat - Ejecuta backend en Windows (cmd.exe)
cd /d "%~dp0"
if not exist venv (python -m venv venv)
call venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
REM Asegúrate de setear DATABASE_URL en este archivo o en .env antes de ejecutar migraciones
REM set DATABASE_URL=mysql+pymysql://synapse:tu_password@localhost:3306/synapse_db
flask --app app:create_app db upgrade
flask --app app:create_app run
```

> Atención: no incluyas contraseñas en texto plano en repositorios públicos. Usa `.env` privado.

---

Si quieres, genero también:
- un `.env.example` en `backend/` (archivo copiable),
- el `.bat` real (`backend/run-backend-windows.bat`) listo para usar.

¿Quieres que cree esos archivos ahora? Si sí, dime si quieres incluir el `.bat` y el `.env.example` en el repo y lo añado (o te doy el contenido para copiar).