# backend/app/routes/auth.py
from flask import Blueprint, request, jsonify, redirect, current_app, render_template_string
import requests
import json
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from ..models import db, Usuario, Rol, PasswordResetCode
from ..utils.validators import validate_email, validate_password
from ..utils.email import send_reset_code_email
from datetime import datetime
from datetime import timedelta
import random
import os # Para manejar la subida de archivos (si aplica)
from werkzeug.utils import secure_filename

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validar campos requeridos
        if not data.get('username') or not data.get('correo') or not data.get('password'):
            return jsonify({'error': 'Username, email y contraseña son requeridos'}), 400

        # Validar formato de email
        email_valid, email_msg = validate_email(data['correo'])
        if not email_valid:
            return jsonify({'error': email_msg}), 400

        # Validar fortaleza de contraseña
        password_valid, password_msg = validate_password(data['password'])
        if not password_valid:
            return jsonify({'error': password_msg}), 400

        # Verificar si el email ya existe
        if Usuario.query.filter_by(correo=data['correo']).first():
            return jsonify({'error': 'El email ya está registrado'}), 400

        # Verificar si el username ya existe
        if Usuario.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'El username ya está registrado'}), 400

        # Obtener rol por defecto (usuario)
        rol_usuario = Rol.query.filter_by(nombre='usuario').first()
        if not rol_usuario:
            return jsonify({'error': 'Rol de usuario no encontrado'}), 500

        # Crear nuevo usuario
        nuevo_usuario = Usuario(
            username=data['username'],
            correo=data['correo'],
            password=generate_password_hash(data['password']),
            rol_id=rol_usuario.id
        )

        db.session.add(nuevo_usuario)
        db.session.commit()

        return jsonify({
            'message': 'Usuario registrado exitosamente',
            'usuario': nuevo_usuario.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/request-password-reset', methods=['POST'])
def request_password_reset():
    """Genera un código numérico y lo envía por correo. Guarda el código en BD con expiración.
    Respuesta genérica para no filtrar existencia del usuario.
    """
    try:
        data = request.get_json() or {}
        correo = data.get('correo')
        if not correo:
            return jsonify({'error': 'Correo es requerido'}), 400

        usuario = Usuario.query.filter_by(correo=correo).first()
        # No revelar si el usuario existe o no
        if not usuario:
            return jsonify({'message': 'Si existe la cuenta, recibirás un correo con el código de recuperación.'}), 200

        # Generar código numérico de 6 dígitos
        code = f"{random.randint(100000, 999999)}"
        expires_at = datetime.utcnow() + timedelta(minutes=15)

        # Asegurar que la tabla exista (útil en entornos de desarrollo sin migraciones aplicadas)
        try:
            db.create_all()
        except Exception:
            pass

        prc = PasswordResetCode(usuario_id=usuario.id_usuario, code=code, expires_at=expires_at, used=False)
        db.session.add(prc)
        db.session.commit()

        # Intentar enviar por correo (loggear intento y resultado para facilitar debug)
        try:
            current_app.logger.info(f"Intentando enviar código a: {usuario.correo} | Código: {code}")
        except Exception:
            pass
        sent = send_reset_code_email(usuario.correo, code)
        try:
            current_app.logger.info(f"Resultado envío: {sent}")
        except Exception:
            pass
        if sent:
            current_app.logger.info('Código enviado correctamente por correo.')
            return jsonify({'message': 'Código de recuperación enviado por correo.'}), 200
        else:
            # Entorno de desarrollo: devolver el código en la respuesta para facilitar pruebas
            current_app.logger.warning('SMTP no configurado o fallo al enviar correo; devolviendo código en respuesta (dev)')
            return jsonify({'message': 'No fue posible enviar correo (dev).', 'dev_code': code}), 200

    except Exception as e:
        current_app.logger.exception('Error generando código de restablecimiento')
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Restablece la contraseña usando el código enviado por correo."""
    try:
        data = request.get_json() or {}
        correo = data.get('correo')
        code = data.get('code')
        new_password = data.get('new_password')

        if not correo or not code or not new_password:
            return jsonify({'error': 'Correo, código y nueva contraseña son requeridos'}), 400

        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Buscar código válido y no usado
        prc = PasswordResetCode.query.filter_by(usuario_id=usuario.id_usuario, code=code, used=False).order_by(PasswordResetCode.expires_at.desc()).first()
        if not prc:
            return jsonify({'error': 'Código inválido o ya usado'}), 400
        if prc.is_expired():
            return jsonify({'error': 'El código ha expirado'}), 400

        # Validar fortaleza de contraseña
        try:
            pw_ok, pw_msg = validate_password(new_password)
            if not pw_ok:
                return jsonify({'error': pw_msg}), 400
        except Exception:
            pass

        # Actualizar contraseña, marcar código como usado
        usuario.password = generate_password_hash(new_password)
        prc.used = True
        db.session.commit()

        # Generar token de acceso para facilitar login inmediato
        access_token = create_access_token(identity=usuario.id_usuario)
        return jsonify({'message': 'Contraseña restablecida correctamente', 'access_token': access_token, 'usuario': usuario.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception('Error restableciendo contraseña')
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """Verifica si el código enviado es válido para el correo proporcionado."""
    try:
        data = request.get_json() or {}
        correo = data.get('correo')
        code = data.get('code')
        if not correo or not code:
            return jsonify({'error': 'Correo y código son requeridos'}), 400

        usuario = Usuario.query.filter_by(correo=correo).first()
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        prc = PasswordResetCode.query.filter_by(usuario_id=usuario.id_usuario, code=code, used=False).order_by(PasswordResetCode.expires_at.desc()).first()
        if not prc:
            return jsonify({'error': 'Código inválido o ya usado'}), 400
        if prc.is_expired():
            return jsonify({'error': 'El código ha expirado'}), 400

        return jsonify({'message': 'Código válido'}), 200
    except Exception as e:
        current_app.logger.exception('Error verificando código')
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        # Validar datos requeridos
        if not data.get('correo') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400

        # Buscar usuario
        usuario = Usuario.query.filter_by(correo=data['correo']).first()

        if not usuario or not check_password_hash(usuario.password, data['password']):
            return jsonify({'error': 'Credenciales inválidas'}), 401

        if not usuario.activo:
            return jsonify({'error': 'Cuenta desactivada'}), 401

        # Actualizar último acceso
        usuario.ultimo_acceso = datetime.utcnow()
        db.session.commit()

        # Crear token JWT
        access_token = create_access_token(identity=usuario.id_usuario)

        return jsonify({
            'access_token': access_token,
            'usuario': usuario.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- Google OAuth endpoints (simple implementation para desarrollo) ---
@auth_bp.route('/google', methods=['GET'])
def google_oauth():
    # Redirect the user to Google's OAuth 2.0 consent screen
    client_id = current_app.config.get('GOOGLE_CLIENT_ID') or os.environ.get('GOOGLE_CLIENT_ID')
    redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI') or os.environ.get('GOOGLE_REDIRECT_URI')
    if not client_id or not redirect_uri:
        return jsonify({'error': 'Google OAuth not configured on server'}), 500

    scope = 'openid email profile'
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={client_id}"
        f"&redirect_uri={redirect_uri}&scope={scope}&access_type=offline&prompt=select_account"
    )
    return redirect(auth_url)


@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    # Exchange code for tokens, get userinfo, create/find local user and return a small HTML
    code = request.args.get('code')
    error = request.args.get('error')
    if error:
        return jsonify({'error': 'Google authentication error', 'details': error}), 400
    if not code:
        return jsonify({'error': 'No code provided by Google'}), 400

    client_id = current_app.config.get('GOOGLE_CLIENT_ID') or os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET') or os.environ.get('GOOGLE_CLIENT_SECRET')
    redirect_uri = current_app.config.get('GOOGLE_REDIRECT_URI') or os.environ.get('GOOGLE_REDIRECT_URI')
    if not client_id or not client_secret or not redirect_uri:
        return jsonify({'error': 'Google OAuth not configured on server'}), 500

    # Exchange code for tokens
    token_url = 'https://oauth2.googleapis.com/token'
    try:
        token_resp = requests.post(token_url, data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }, timeout=10)
        token_resp.raise_for_status()
        token_data = token_resp.json()
    except Exception as e:
        current_app.logger.exception('Error exchanging code for token')
        return jsonify({'error': 'Error exchanging code for token', 'details': str(e)}), 500

    access_token = token_data.get('access_token')
    if not access_token:
        return jsonify({'error': 'No access_token received from Google', 'details': token_data}), 500

    # Fetch userinfo
    try:
        ui = requests.get('https://www.googleapis.com/oauth2/v3/userinfo', headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
        ui.raise_for_status()
        userinfo = ui.json()
    except Exception as e:
        current_app.logger.exception('Error fetching userinfo')
        return jsonify({'error': 'Error fetching userinfo', 'details': str(e)}), 500

    # Extract standard fields
    correo = userinfo.get('email')
    nombre = userinfo.get('name') or userinfo.get('given_name') or userinfo.get('email')
    avatar = userinfo.get('picture')

    if not correo:
        return jsonify({'error': 'Google did not return an email'}), 500

    try:
        usuario = Usuario.query.filter_by(correo=correo).first()
        if usuario:
            # Update basic profile
            usuario.nombre_completo = usuario.nombre_completo or nombre
            if avatar:
                usuario.avatar_url = usuario.avatar_url or avatar
            db.session.commit()
        else:
            # Create new user with default role
            rol_usuario = Rol.query.filter_by(nombre='usuario').first()
            # Ensure we provide a non-null password for users created via OAuth
            # (DB requires password non-nullable). Store a random hashed password.
            random_pw_hash = generate_password_hash(os.urandom(24).hex())
            if not rol_usuario:
                # fallback: create user without role set
                nuevo = Usuario(username=correo.split('@')[0], correo=correo, nombre_completo=nombre, avatar_url=avatar, password=random_pw_hash)
            else:
                nuevo = Usuario(username=correo.split('@')[0], correo=correo, nombre_completo=nombre, avatar_url=avatar, rol_id=rol_usuario.id, password=random_pw_hash)
            db.session.add(nuevo)
            db.session.commit()
            usuario = nuevo
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception('Error creating/updating user from Google profile')
        return jsonify({'error': 'Error creating/updating user', 'details': str(e)}), 500

    # Create JWT for the user
    try:
        access_jwt = create_access_token(identity=usuario.id_usuario)
    except Exception as e:
        current_app.logger.exception('Error creating JWT')
        return jsonify({'error': 'Error creating JWT', 'details': str(e)}), 500

    # Render a small HTML page that posts a message to the opener with token and usuario
    payload = {'type': 'oauth', 'provider': 'google', 'token': access_jwt, 'usuario': usuario.to_dict()}
    safe_json = json.dumps(payload)
    html = render_template_string(
        """
        <!doctype html>
        <html>
        <head><meta charset="utf-8"><title>Google OAuth</title></head>
        <body>
        <script>
        try {
            const data = {{ safe_json|safe }};
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(data, '*');
            }
        } catch (e) { console.error(e); }
        try { window.close(); } catch (e) {}
        </script>
        <p>Autenticando...</p>
        </body>
        </html>
        """,
        safe_json=safe_json
    )
    return html

# --- fin Google OAuth ---

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)

        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # El to_dict() ya incluye los nuevos campos si se agregaron al modelo
        return jsonify(usuario.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Nuevo endpoint para actualizar perfil del usuario actual ---
@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    try:
        usuario_id = get_jwt_identity()
        usuario = Usuario.query.get(usuario_id)

        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Manejar datos de formulario o JSON
        # request.form se usa para datos y archivos (multipart/form-data)
        # request.get_json() se usa para JSON puro
        # Flask lo maneja automáticamente en este contexto para acceder a ambos.
        data = request.form if request.form else request.get_json()

        # Helper: obtener el primer valor de un campo tanto de form-data (request.form)
        # como de JSON. Esto evita que lleguen listas/tuplas a los atributos del modelo
        # (p.ej. cuando el cliente envía valores duplicados o FormData crea arrays).
        def _first_value(key):
            # Si viene en form-data (ImmutableMultiDict), preferir getlist para tomar el primer elemento
            try:
                if request.form and key in request.form:
                    vals = request.form.getlist(key)
                    if vals:
                        return vals[0]
            except Exception:
                pass

            # Si data proviene de JSON u otra estructura, manejar listas/tuplas
            v = data.get(key) if isinstance(data, dict) else None
            try:
                if isinstance(v, (list, tuple)) and len(v) > 0:
                    return v[0]
            except Exception:
                pass

            return v

        # Requerir que el usuario haya editado el nombre completo para permitir la actualización
        if 'nombre_completo' not in data and 'nombre_completo' not in request.form:
            return jsonify({'error': 'Para actualizar el perfil debes editar el nombre completo.'}), 400
        new_nombre = _first_value('nombre_completo')
        if not new_nombre or str(new_nombre) == str(usuario.nombre_completo or usuario.username or ''):
            return jsonify({'error': 'Para actualizar el perfil debes cambiar el nombre completo.'}), 400

        # Actualizar campos permitidos
        if 'username' in data or 'username' in request.form:
            new_username = _first_value('username')
            # Verificar unicidad si se cambia
            if new_username != usuario.username and Usuario.query.filter_by(username=new_username).first():
                 return jsonify({'error': 'El username ya está registrado'}), 400
            usuario.username = new_username

        if 'correo' in data or 'correo' in request.form:
            new_correo = _first_value('correo')
            # Verificar unicidad si se cambia
            if new_correo != usuario.correo and Usuario.query.filter_by(correo=new_correo).first():
                 return jsonify({'error': 'El email ya está registrado'}), 400
            usuario.correo = new_correo

        # --- Actualizaciones para campos de perfil ---
        if 'nombre_completo' in data or 'nombre_completo' in request.form:
            usuario.nombre_completo = _first_value('nombre_completo')

        if 'telefono' in data or 'telefono' in request.form:
            usuario.telefono = _first_value('telefono')

        if 'ubicacion' in data or 'ubicacion' in request.form:
            usuario.ubicacion = _first_value('ubicacion')

        if ('fecha_nacimiento' in data and data.get('fecha_nacimiento')) or ('fecha_nacimiento' in request.form and request.form.getlist('fecha_nacimiento')):
            try:
                # Asumiendo formato YYYY-MM-DD
                fecha_val = _first_value('fecha_nacimiento')
                usuario.fecha_nacimiento = datetime.strptime(fecha_val, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Formato de fecha de nacimiento inválido (YYYY-MM-DD)'}), 400

        if 'descripcion' in data or 'descripcion' in request.form:
            usuario.descripcion = _first_value('descripcion')

        # Manejo de avatar
        if 'avatar' in request.files:
            file = request.files['avatar']
            if file and file.filename != '':
                # --- Lógica de subida de archivo ---
                # Asegúrate de tener una carpeta 'uploads' o similar
                upload_folder = os.environ.get('UPLOAD_FOLDER', 'uploads') # Define UPLOAD_FOLDER en .env o config
                os.makedirs(upload_folder, exist_ok=True)
                filename = secure_filename(file.filename)
                file_path = os.path.join(upload_folder, f"{usuario.id_usuario}_{filename}")
                file.save(file_path)
                # Guardar ruta relativa o URL pública
                usuario.avatar_url = f"/uploads/{os.path.basename(file_path)}" # Ajusta según tu servidor de archivos

        # Opción para eliminar avatar
        if (('remove_avatar' in data and _first_value('remove_avatar') == '1')
            or ('remove_avatar' in request.form and _first_value('remove_avatar') == '1')):
            # Opcional: Eliminar archivo físico si existe
            if usuario.avatar_url:
                try:
                    file_path_to_delete = os.path.join('backend', usuario.avatar_url.lstrip('/')) # Ajusta la ruta
                    if os.path.exists(file_path_to_delete):
                        os.remove(file_path_to_delete)
                except OSError:
                    pass # No hacer nada si no se puede eliminar el archivo
            usuario.avatar_url = None

        db.session.commit()

        # Devolver el usuario actualizado
        return jsonify(usuario.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR UPDATE PROFILE] {str(e)}")
        return jsonify({'error': 'Error interno al actualizar el perfil'}), 500
# --- Fin del nuevo endpoint ---

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()

        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Contraseña actual y nueva son requeridas'}), 400

        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Verificar contraseña actual
        if not check_password_hash(usuario.password, data['current_password']):
            return jsonify({'error': 'Contraseña actual incorrecta'}), 400

        # Actualizar contraseña
        usuario.password = generate_password_hash(data['new_password'])
        db.session.commit()

        return jsonify({'message': 'Contraseña actualizada exitosamente'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Opcional: Endpoint para eliminar la cuenta
@auth_bp.route('/delete-account', methods=['POST'])
@jwt_required()
def delete_account():
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()
        password = data.get('password')

        if not password:
            return jsonify({'error': 'Contraseña es requerida para eliminar la cuenta'}), 400

        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        if not check_password_hash(usuario.password, password):
            return jsonify({'error': 'Contraseña incorrecta'}), 400

        # Aquí podrías implementar una lógica de "soft delete" o eliminación real
        # Por ejemplo, desactivar al usuario:
        usuario.activo = False
        # O eliminarlo completamente (¡peligroso!):
        # db.session.delete(usuario)

        db.session.commit()
        # Opcional: revocar token (requiere manejo adicional)
        return jsonify({'message': 'Cuenta eliminada exitosamente'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Opcional: Endpoint para cerrar sesión en todos los dispositivos
# Esto generalmente implica manejar tokens revocados en una lista negra (blacklist)
# o usar una estrategia de refresh token.
# Por simplicidad, aquí solo se podría devolver un mensaje indicando
# que el cliente debe borrar su token localmente.
@auth_bp.route('/logout-all-devices', methods=['POST'])
@jwt_required()
def logout_all_devices():
    try:
        usuario_id = get_jwt_identity()
        data = request.get_json()
        password = data.get('password')

        if not password:
            return jsonify({'error': 'Contraseña es requerida para cerrar sesión en otros dispositivos'}), 400

        usuario = Usuario.query.get(usuario_id)
        if not usuario:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        if not check_password_hash(usuario.password, password):
            return jsonify({'error': 'Contraseña incorrecta'}), 400

        # En una implementación real, aquí se añadiría el token a una blacklist
        # o se invalidaría el refresh token del usuario.
        # Por ahora, simplemente devolvemos un mensaje.
        return jsonify({'message': 'Por favor, cierre sesión en otros dispositivos borrando el token localmente.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
