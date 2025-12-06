FROM python:3.11-slim

# Preparar directorio de trabajo
WORKDIR /app

# Variables de entorno para comportamiento de Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copiar y instalar dependencias
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copiar el resto del proyecto
COPY . .

# Puerto por defecto (Railway provee $PORT en runtime)
EXPOSE 5000

# Arrancar con gunicorn usando $PORT si está presente, si no usar 5000
CMD ["sh", "-c", "gunicorn run:app --bind 0.0.0.0:${PORT:-5000} --workers 2"]
