# Fase 1: Configuración del Entorno de Verificación

## Resumen de la Fase
El objetivo de esta fase era configurar un entorno de desarrollo y pruebas aislado utilizando Docker para orquestar los servicios de backend, frontend y base de datos.

## Acciones Realizadas y Comandos Ejecutados

1.  **Creación del Dockerfile:** Se creó un `Dockerfile` en la raíz del proyecto para definir el entorno del contenedor del backend.
    ```dockerfile
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
    ```

2.  **Creación de `docker-compose.yml`:** Se creó un archivo de composición para orquestar los tres servicios.
    ```yaml
    version: '3.9'

    services:
      db:
        image: postgres:15
        container_name: db_test
        environment:
          POSTGRES_USER: admin
          POSTGRES_PASSWORD: admin
          POSTGRES_DB: turismo
        ports:
          - "5432:5432"
        volumes:
          - postgres_data:/var/lib/postgresql/data/

      backend:
        build: .
        container_name: backend_test
        command: python backend/manage.py runserver 0.0.0.0:8000
        ports:
          - "8000:8000"
        volumes:
          - .:/app
        depends_on:
          - db
        environment:
          - DATABASE_URL=postgres://admin:admin@db:5432/turismo
          - DJANGO_SETTINGS_MODULE=puerto_gaitan_turismo.settings

      frontend:
        image: node:20
        container_name: frontend_test
        working_dir: /app/frontend
        command: sh -c "npm install && npm run dev"
        ports:
          - "3000:3000"
        volumes:
          - .:/app
        depends_on:
          - backend

    volumes:
      postgres_data: {}
    ```

3.  **Intento de construcción de contenedores:** Se ejecutaron los siguientes comandos para iniciar el entorno:
    *   `docker-compose up -d --build`
    *   `docker compose up -d --build`
    *   `sudo docker compose up -d --build`

## Resultados y Hallazgos (BLOQUEO)

El proceso de construcción falló debido a las siguientes razones:

1.  **Permisos del Demonio de Docker:** El primer intento falló por falta de permisos para acceder al socket de Docker. Esto se solucionó temporalmente usando `sudo`.
    ```
    unable to get image 'node:20': permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
    ```

2.  **Límite de Tasa de Docker Hub:** El intento final resultó en un error de `toomanyrequests`, indicando que se había alcanzado el límite de descargas de imágenes para usuarios no autenticados.
    ```
    toomanyrequests: You have reached your unauthenticated pull rate limit.
    ```

## Conclusión de la Fase 1

Debido al bloqueo insuperable con el límite de tasa de Docker Hub, no es posible continuar con la configuración del entorno local usando Docker.

**Acción Correctiva:** Se procederá con el plan alternativo especificado en las instrucciones: utilizar un flujo de trabajo de **GitHub Actions** para crear un entorno de verificación.

**Fin del Informe de la Fase 1.**