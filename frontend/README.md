# Frontend — Cómo ejecutar (React + Vite)

Este README explica cómo poner en marcha el frontend (desarrollo y build) en Windows usando cmd.exe.

Requisitos
- Node.js 16+ (o una versión LTS compatible con Vite)
- npm (incluido con Node.js)

Pasos rápidos (cmd.exe)

1) Ir al directorio `frontend`

```bat
cd "c:\Git Hub\synapse_final\frontend"
```

Bash (Linux / macOS / WSL):

```bash
cd "/c/Git Hub/synapse_final/frontend"  # si usas WSL o Git Bash ajusta la ruta según tu entorno
```

2) Instalar dependencias

```bat
npm install
```

Bash:

```bash
npm install
```

3) Ejecutar en modo desarrollo (Vite)

```bat
npm run dev
```

Bash:

```bash
npm run dev
```

- El servidor de desarrollo usa por defecto `http://localhost:5173`.
- Si el frontend necesita comunicarse con el backend en `http://localhost:5000`, el proyecto puede tener una configuración de proxy en `vite.config.js` que redirige prefijos como `/api` al backend. Revisa `vite.config.js` si necesitas cambiar la URL del backend.

4) Probar traducciones y API

- Abre `http://localhost:5173` en el navegador.
- En DevTools -> Network, busca las peticiones a `/locales/<lng>/common.json` para confirmar que las traducciones se cargan.
- Revisa las peticiones a `/api/...` y verifica que lleguen al backend (observa la consola del backend para las entradas).

5) Generar build de producción

```bat
npm run build
```

- El resultado queda en `frontend/dist`.

6) Servir el build (opciones)

- Opción rápida con `serve` (instala globalmente si no lo tienes):

```bat
npm install -g serve
serve -s dist -l 5000
```

Bash:

```bash
npm install -g serve
npx serve -s dist -l 5000
```

  - Esto servirá el contenido estático en `http://localhost:5000` (útil para pruebas sencillas).

- Opción: integrar el `dist` con el backend (para producción)
  - Puedes copiar el contenido de `frontend/dist` al directorio estático del backend y configurar Flask para servir los archivos estáticos (por ejemplo `app = Flask(__name__, static_folder='dist', static_url_path='')`). Si quieres, puedo añadir un ejemplo de integración en `backend/run.py`.

Notas y troubleshooting

- Si ves errores de CORS al hacer peticiones desde `http://localhost:5173`, confirma que `backend/app/config.py` incluye `http://localhost:5173` en `CORS_ORIGINS`.
- Si las peticiones /api son 404 en el navegador, verifica que el backend esté corriendo y que la ruta esté correctamente prefijada por `/api`.
- Si cambias el puerto del backend, actualiza el proxy en `vite.config.js` o asigna la variable de entorno `VITE_API_URL` si el proyecto la soporta.

¿Quieres que añada un script adicional para desplegar `dist` dentro del backend automáticamente (por ejemplo copiar `dist` a `backend/static/`)? Puedo crear un script `npm run deploy-backend` que haga la copia y opciones mínimas de integración.
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
