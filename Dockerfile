# Usa una imagen base de Python slim
FROM python:3.12-slim AS backend

# Etiqueta para identificar al mantenedor
LABEL maintainer="Jules"

# Evita que los diálogos interactivos bloqueen la compilación
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependencias del sistema requeridas por Playwright y otras herramientas
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    curl \
    wget \
    git \
    # Dependencias de Playwright para navegadores
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libasound2 \
    libgbm-dev \
    libxkbcommon-x11-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    fonts-liberation \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libdrm2 \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    gstreamer1.0-tools \
    && apt-get clean

# Establece el directorio de trabajo
WORKDIR /app

# Copia el código fuente del backend al contenedor
COPY backend/ ./backend/

# Establece el directorio de trabajo dentro de la carpeta del backend
WORKDIR /app/backend

# Actualiza pip e instala las dependencias de Python
RUN pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Instala Playwright y sus navegadores
RUN npm install -g playwright && playwright install --with-deps

# Expone el puerto que usará la aplicación Django
EXPOSE 8000

# Comando por defecto para iniciar el servidor de Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]