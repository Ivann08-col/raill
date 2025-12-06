import smtplib
from email.message import EmailMessage
from flask import current_app
import logging


def send_reset_code_email(to_email: str, code: str):
    """Send a simple email with the reset code using SMTP config from app config.
    Returns True if sent, False otherwise.
    """
    cfg = current_app.config
    mail_server = cfg.get('MAIL_SERVER')
    mail_port = cfg.get('MAIL_PORT')
    mail_user = cfg.get('MAIL_USERNAME')
    mail_pass = cfg.get('MAIL_PASSWORD')
    mail_use_tls = cfg.get('MAIL_USE_TLS', True)
    mail_use_ssl = cfg.get('MAIL_USE_SSL', False)
    mail_default_sender = cfg.get('MAIL_DEFAULT_SENDER') or mail_user

    # Normalize and provide sensible defaults for common providers (e.g. Gmail)
    try:
        # If port came as string from env, try to convert to int
        if mail_port:
            try:
                mail_port = int(mail_port)
            except Exception:
                pass

        # If server not set but username looks like a Gmail address, default to Gmail SMTP
        if (not mail_server or str(mail_server).strip() == '') and mail_user and isinstance(mail_user, str) and mail_user.lower().endswith('@gmail.com'):
            mail_server = 'smtp.gmail.com'
            if not mail_port:
                mail_port = 587
            mail_use_tls = True

        # Ensure sender fallback
        if not mail_default_sender:
            mail_default_sender = mail_user

        # Log SMTP config (mask password) to help debugging in dev
        masked = (('*' * len(mail_pass)) if mail_pass else None)
        current_app.logger.info(f"SMTP config - server={mail_server or ''} port={mail_port or ''} user={mail_user or ''} pass={masked} use_tls={mail_use_tls} use_ssl={mail_use_ssl} sender={mail_default_sender or ''}")
    except Exception:
        current_app.logger.exception('Error normalizando configuración SMTP')

    # Validate required fields
    if not mail_server or not mail_port or not mail_user or not mail_pass:
        current_app.logger.warning('SMTP no configurado correctamente; no se envía correo')
        return False

    subject = 'Código de recuperación de contraseña'
    body = f'Tu código de recuperación de contraseña es: {code}\n\nSi no solicitaste este código, ignora este mensaje.'

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = mail_default_sender
    msg['To'] = to_email
    msg.set_content(body)

    try:
        if mail_use_ssl:
            with smtplib.SMTP_SSL(mail_server, mail_port) as server:
                server.login(mail_user, mail_pass)
                server.send_message(msg)
        else:
            with smtplib.SMTP(mail_server, mail_port) as server:
                if mail_use_tls:
                    server.starttls()
                server.login(mail_user, mail_pass)
                server.send_message(msg)
        return True
    except Exception as e:
        current_app.logger.exception('Error enviando correo SMTP: %s', e)
        return False
