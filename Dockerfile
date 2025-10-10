FROM python:3.12-slim AS backend

# Instala dependencias del sistema necesarias para Playwright
RUN apt-get update && apt-get install -y \
    nodejs npm curl wget git libgtk-3-0 libnss3 libxss1 libasound2 \
    libgbm-dev libxkbcommon-x11-0 libxcomposite1 libxdamage1 libxrandr2 \
    fonts-liberation libappindicator3-1 libatk-bridge2.0-0 libdrm2 \
    gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-tools \
    && apt-get clean

WORKDIR /app

# Copiar backend
COPY backend/ ./backend/

WORKDIR /app/backend
RUN pip install --upgrade pip && pip install -r requirements.txt

# Instalar Playwright (con navegadores y dependencias)
# El comando correcto para instalar dependencias de sistema es --with-deps
RUN npx playwright install --with-deps

# Comando por defecto para correr migraciones o tests
CMD ["python", "manage.py", "test"]