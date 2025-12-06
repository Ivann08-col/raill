

---

# 🧠¿Qué es Synapse?

**Synapse** es una plataforma integral de **productividad, bienestar mental y gamificación** orientada a estudiantes, profesionales y cualquier persona que quiera mejorar sus hábitos de estudio, concentración y autocuidado.

Combina técnicas validadas (como Pomodoro o Mindfulness) con seguimiento de tareas, salas colaborativas, recompensas y análisis de progreso.

---


## 🧠 Funcionalidades Principales

### 1. **Técnicas de Productividad y Bienestar**
- **Pomodoro**: Temporizador con ciclos personalizables (trabajo, descanso, descanso largo).
- **Meditación guiada**: Varias técnicas (Mindfulness, Respiración 4-7-8, Body Scan, etc.).
- **Modo sin distracciones**: Opción para minimizar interrupciones durante sesiones.
- **Sesiones grupalas**: Estudiar o meditar en tiempo real con otros usuarios.

> 💡 Todo esto está implementado tanto en lógica de backend como en componentes de frontend.

---

### 2. **Gestión de Tareas**
- Crear, editar y eliminar tareas.
- Asignar prioridad (baja, media, alta).
- Establecer fechas de vencimiento.
- Marcar como completadas.
- Organizar tareas en **“listas”**, que técnicamente son **salas privadas**.
- Ver estadísticas: tareas vencidas, completadas anticipadamente, productividad semanal.

---

### 3. **Sistema de Recompensas (Gamificación)**
- El usuario gana recompensas al lograr hitos:
  - Completar X sesiones de meditación.
  - Estudiar X minutos seguidos.
  - Completar tareas antes de tiempo.
  - Usar el modo sin distracciones.
- Las recompensas tienen:
  - Nombre, descripción, tipo (puntos, personalización, técnica).
  - Requisitos definidos como JSON (ej: `{ "sesiones_completadas": 10 }`).
- Sistema de niveles: principiante → experto.

---

### 4. **Salas Colaborativas**
- Crear salas públicas o privadas (con código de acceso).
- Invitar a otros usuarios.
- Asignar roles: líder o invitado.
- Salir o eliminar salas.
- Las tareas y sesiones pueden asociarse a una sala (para trabajo en equipo).

---

### 5. **Progreso y Estadísticas**
- Seguimiento diario/semanal/mensual:
  - Minutos de estudio.
  - Sesiones completadas.
  - Tareas finalizadas.
- Racha de días consecutivos.
- Técnica más usada.
- Día con mayor productividad.
- API dedicada para obtener informes detallados.

---

### 6. **Perfil de Usuario**
- Edición de datos: nombre, email, teléfono, ubicación, fecha de nacimiento.
- Subida de avatar (con validación de tamaño).
- Visualización de progreso personal.
- Eliminación o cambio de contraseña.

---

### 7. **Autenticación y Seguridad**
- Registro/login con validación:
  - Email válido.
  - Contraseña fuerte (mayúsculas, minúsculas, números, símbolos).
- JWT para autenticación segura.
- Roles: **usuario** y **administrador**.
- Protección contra usuarios inactivos.

---

### 8. **Internacionalización (i18n)**
El frontend soporta **4 idiomas**:
- Español (es)
- Inglés (en)
- Chino mandarín (zh)
- Hindi (hi)

Se detecta automáticamente el idioma del navegador y permite cambiarlo manualmente.

---

### 9. **Panel de Administración** *(en desarrollo)*
- Gestión de usuarios (ver, editar, desactivar).
- Visualización de tareas y roles.
- *(Actualmente en pruebas: hay rutas pero falta autenticación de rol en frontend)*.

---

## 🏗️ Arquitectura del Proyecto

### Backend (Python + Flask)
- **Base de datos**: MariaDB/MySQL (con SQLAlchemy).
- **Migraciones**: Flask-Migrate (Alembic).
- **API REST**: Endpoints bajo `/api/*`.
- **Autenticación**: JWT + middleware de roles.
- **Estructura modular**: rutas, controladores, servicios y modelos separados.
- **Scripts de inicialización**:
  - `seed_roles.py`: crea roles (admin/usuario).
  - `seed_data.py`: llena DB con datos de ejemplo (usuarios, tareas, técnicas, recompensas).
  - `create_admin.py`: crea usuario admin predeterminado.

> 🛠️ Ejemplo de credenciales de admin:
> - Email: `admin@synapse.com`
> - Contraseña: `admin123`

---

### Frontend (React + Vite)
- **Enrutamiento**: React Router (páginas públicas y privadas).
- **Gestión de estado**: localStorage + contexto implícito en componentes.
- **Estilos**: CSS moderno con soporte para modo oscuro/claro.
- **Proxy a backend**: `/api` → `http://localhost:5000` (definido en `vite.config.js`).
- **Componentes modulares**:
  - `Navbar`, `Footer`, `AuthModal`, `EditProfileModal`, etc.
- **Manejo de errores**: `ErrorBoundary` global.

---

## 🚀 Flujo de Uso Típico

1. **Registro/Login** → obtiene token JWT.
2. **Accede al dashboard** → ve sus tareas y técnicas.
3. **Inicia una sesión de Pomodoro o Meditación** → el frontend gestiona el temporizador.
4. Al terminar, envía los datos al backend → se guarda en la DB.
5. El sistema **verifica recompensas automáticas**.
6. El usuario ve su **progreso en gráficos y estadísticas**.
7. Puede unirse a una **sala grupal** para estudiar con otros.

---

## 📁 Carpetas Clave

```
synapse_final/
├── backend/
│   ├── app/
│   │   ├── routes/        # Endpoints API
│   │   ├── controllers/   # Lógica de negocio por dominio
│   │   ├── services/      # Servicios reutilizables (PomodoroService, etc.)
│   │   ├── models/        # Modelos de base de datos
│   │   ├── scripts/       # Seeds y datos iniciales
│   │   └── config.py      # Configuración (DB, JWT, CORS)
│   ├── run.py             # Punto de entrada
│   └── requirements.txt   # Dependencias
│
└── frontend/
    ├── src/
    │   ├── pages/         # Páginas principales (Login, Tareas, Pomodoro, etc.)
    │   ├── components/    # Componentes reutilizables
    │   ├── services/      = api.js, auth.js
    │   └── App.jsx        # Enrutador principal
    ├── vite.config.js     # Proxy a backend
    └── public/locales/    # Archivos de traducción
```

# 📚 Guía Completa de Despliegue: Synapse (Frontend + Backend)

Esta guía te lleva paso a paso para configurar y ejecutar **localmente** este proyecto:

---

## 🧰 Requisitos Previos (Sistema)

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina (Windows, Linux o macOS):

- **[Node.js](https://nodejs.org/)** (versión 16 o superior, incluye `npm`)
- **[Python](https://www.python.org/)** (versión 3.9 o superior)
- **[Git](https://git-scm.com/)** (para clonar el repositorio y usar Git Bash en Windows)
- **[MariaDB/MySQL](https://mariadb.org/)** (con el servicio iniciado y un usuario con permisos, típicamente `root`)

> **Importante para Windows:** Se recomienda usar **Git Bash** como terminal para seguir esta guía.

---

## 🗂️ 1. Estructura del Proyecto

El proyecto tiene dos partes principales:

```
synapse_final/
├── backend/     # API en Python (Flask)
└── frontend/    # Aplicación web (React + Vite)
```

---

## ⚙️ 2. Configuración y Ejecución del Backend

Sigue estos pasos **en orden** dentro de la carpeta `backend/`.

### Paso 1: Navegar al directorio del backend
Abre tu terminal (Git Bash en Windows) y ve a la carpeta del backend.

```bash
cd tu_ruta/synapse_final/backend
```

### Paso 2: Crear y activar un entorno virtual
Esto aísla las dependencias del proyecto.

```bash
# Crear el entorno virtual
python -m venv venv

# Activarlo (en Windows con Git Bash)
source venv/Scripts/activate
```
> Verás `(venv)` al inicio de tu línea de comandos.

### Paso 3: Instalar las dependencias
Instala todas las librerías de Python necesarias.

```bash
pip install -r requirements.txt
```

### Paso 4: Configurar la Base de Datos
1.  **Crea una base de datos** llamada `synapse_db` en tu MariaDB/MySQL.
2.  **Asegúrate** de que el usuario `root` tenga acceso con la contraseña `koal` en el puerto `3307`.

    Si tu configuración es diferente (por ejemplo, puerto `3306` y contraseña vacía), **edita el archivo** `backend/app/config.py` y actualiza la variable `SQLALCHEMY_DATABASE_URI`:

    ```python
    # Ejemplo para puerto 3306 y sin contraseña
    SQLALCHEMY_DATABASE_URI = 'mysql+pymysql://root:@localhost:3306/synapse_db'
    ```

### Paso 5: Inicializar y aplicar migraciones
Estos comandos crearán las tablas en tu base de datos.

```bash
# Inicializar el sistema de migraciones
flask --app app:create_app db init

# Generar la migración inicial
flask --app app:create_app db migrate -m "Initial"

# Aplicar la migración a la base de datos
flask --app app:create_app db upgrade
```

### Paso 6: Insertar datos iniciales (Roles)
Este paso es **obligatorio** para que el sistema de usuarios funcione.

```bash
# Asegurar la estructura del paquete (puede que ya exista)
touch app/scripts/__init__.py

# Ejecutar el script de roles
python -m app.scripts.seed_roles
```
> Verás en consola: `Rol 'usuario' creado.`, `Rol 'administrador' creado.`.

### Paso 7: Iniciar el servidor de desarrollo
El backend ahora está listo para correr.

```bash
flask --app app:create_app run
```
- **URL por defecto:** `http://127.0.0.1:5000`
- Verifica que funcione visitando esa URL en tu navegador. Deberías ver un mensaje JSON de bienvenida.

> **Para detener el servidor:** Presiona `Ctrl + C` en la terminal.

> **Para salir del entorno virtual:** Ejecuta `deactivate`.

---

## 🎨 3. Configuración y Ejecución del Frontend

Sigue estos pasos en la carpeta `frontend/`.

### Paso 1: Navegar al directorio del frontend
En una **nueva terminal**, ve a la carpeta del frontend.

```bash
cd tu_ruta/synapse_final/frontend
```

### Paso 2: Instalar las dependencias
Instala todas las librerías de Node.js necesarias.

```bash
npm install
# ó
npm i
```

### Paso 3: Iniciar el servidor de desarrollo
Vite iniciará un servidor de desarrollo con recarga en caliente.

```bash
npm run dev
```
- **URL por defecto:** `http://localhost:5173`
- La aplicación se abrirá automáticamente en tu navegador.

### Configuración de Proxy (Importante)
El archivo `vite.config.js` ya está configurado para redirigir todas las peticiones que comienzan con `/api` al backend (`http://localhost:5000`).

```js
// frontend/vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```
Esto significa que desde tu código frontend puedes hacer peticiones a `/api/auth/login` y Vite se encargará de enviarlas al backend.

> **Asegúrate de que el backend esté corriendo** (`http://localhost:5000`) antes de usar la aplicación frontend.

---

## 🚀 Resumen de Comandos

| Acción | Comando (Backend) | Comando (Frontend) |
| :--- | :--- | :--- |
| **Navegar** | `cd backend` | `cd frontend` |
| **Instalar** | `pip install -r requirements.txt` | `npm install` |
| **Iniciar** | `flask --app app:create_app run` | `npm run dev` |
| **Detener** | `Ctrl + C` | `Ctrl + C` |