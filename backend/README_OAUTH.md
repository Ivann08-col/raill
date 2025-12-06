Google OAuth2 — configuración para desarrollo local

Este archivo explica cómo obtener y colocar las credenciales de Google Cloud necesarias para el login con Google (OAuth2), y cómo probar el flujo en desarrollo.

1) Crear credenciales en Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Selecciona o crea un proyecto.
- En el menú lateral: "APIs & Services" -> "OAuth consent screen".
  - Configura el consentimiento (Application name, Support email, scopes si es necesario).
  - Si vas a probar solo tú, puedes seleccionar "External" y añadir tu cuenta de prueba.
- Luego: "Credentials" -> "Create Credentials" -> "OAuth client ID".
  - Application type: "Web application".
  - Name: p. ej. "Synapse Local".
  - En "Authorized redirect URIs" añade EXACTAMENTE:
    - http://localhost:5000/api/auth/google/callback
  - Crea y copia el `Client ID` y `Client secret`.

2) Añadir credenciales al proyecto (local)
- En el directorio `backend/` crea un archivo `.env` (no lo subas al repo).
- Añade estas líneas (pegando tus valores):

```
GOOGLE_CLIENT_ID=XXX
GOOGLE_CLIENT_SECRET=XXX
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

- Ya está: `run.py` carga las variables con `python-dotenv`.

3) Instalar dependencias e iniciar servidor
- Desde el directorio `backend`:

```cmd
pip install -r requirements.txt
python run.py
```

- El backend quedará disponible por defecto en `http://localhost:5000`.

4) Ajustes en frontend
- En el frontend asegúrate de que el popup abra la URL del backend:

```js
window.open('http://localhost:5000/api/auth/google', 'google_oauth', 'width=600,height=700')
```

5) Prueba manual
- Abre la app frontend, pulsa "Continuar con Google".
- Se abrirá el chooser de Google; selecciona una cuenta.
- Tras aceptar, la ventana emergente redirigirá al backend, que devolverá una página que envia `postMessage` al `window.opener` con el token y datos del usuario y luego cierra la ventana.

6) Notas de seguridad y producción
- No subas `.env` a git. Usa Secret Manager en producción (e.g. GCP Secret Manager) y HTTPS.
- Registra con exactitud la `redirect_uri` en Google Cloud Console.
- Considera implementar `state` para prevenir CSRF en el flujo OAuth.

Si quieres, puedo:
- Añadir la verificación `state` en el backend (recomendado).
- Actualizar automáticamente el frontend para usar la URL completa del backend.
- Crear un script que genere un `.env` localmente a partir de variables de entorno.
