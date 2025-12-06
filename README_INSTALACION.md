# PROYECTO_SYNAPSE - Guía de Instalación

## Requisitos Generales
- Python 3.8+
- Node.js 16+ y npm
- (Opcional) Git

---

## 1. Backend (Python)

### Crear y activar entorno virtual (recomendado)
```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate
```

### Instalar dependencias
```bash
pip install flask
pip install flask-cors
pip install flask-jwt-extended
pip install flask-migrate
pip install flask-sqlalchemy
pip install flask-socketio
pip install python-dotenv
pip install pytz
pip install eventlet
pip install alembic
```
O simplemente:
```bash
pip install -r requirements.txt
```

### Migraciones de base de datos
```bash
cd backend
alembic upgrade head
```

### Ejecutar el backend
```bash
cd backend
python run.py
```

---

## 2. Frontend (React)

### Instalar dependencias
```bash
cd frontend
npm install
```

### Ejecutar el frontend
```bash
npm run dev
```

---

## 3. App Web/Móvil (Expo/Vite)

### Instalar dependencias
```bash
cd APP
npm install
```

### Ejecutar la app
```bash
npm run dev
```

---

## Notas
- Asegúrate de tener las variables de entorno necesarias en un archivo `.env` si tu proyecto lo requiere.
- Si tienes problemas con dependencias, revisa los archivos `requirements.txt` (backend) y `package.json` (frontend/APP).
- Si usas otro gestor de base de datos, revisa la configuración en `backend/app/config.py`.

---

¡Listo! Con esto tu proyecto debería correr en cualquier PC siguiendo estos pasos.
