"""
Script de prueba para envío de email usando configuración SMTP del backend
Uso: activar el venv y ejecutar `python -m app.scripts.test_send_email`
"""

import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno ANTES de importar Flask/app
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Añadir la carpeta backend al sys.path para importar app correctamente
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from app import create_app
from app.utils.email import send_reset_code_email

if __name__ == "__main__":
    destinatario = input("Correo destino para prueba: ")
    codigo = input("Código a enviar (enter para 123456): ") or "123456"
    app = create_app()
    with app.app_context():
        resultado = send_reset_code_email(destinatario, codigo)
    print(f"¿Correo enviado?: {resultado}")
