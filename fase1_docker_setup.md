# Informe Fase 1: Configuración del Entorno Docker

## Resumen de la Fase

El objetivo de esta fase era configurar un entorno de desarrollo local completo utilizando Docker y Docker Compose para orquestar los servicios de backend, frontend y base de datos.

## Acciones Realizadas

1.  **Limpieza del Entorno:** Se eliminaron los archivos `Dockerfile` y `docker-compose.yml` preexistentes para asegurar una configuración limpia.
    *   **Comando:** `rm -f Dockerfile docker-compose.yml`

2.  **Creación del Dockerfile:** Se creó un `Dockerfile` para el servicio de backend (Python/Django).
    *   **Archivo:** `Dockerfile`
    *   **Contenido:**
        ```Dockerfile
        FROM python:3.12-slim
        WORKDIR /app
        COPY ./backend/requirements.txt /app/
        RUN pip install --no-cache-dir -r requirements.txt
        COPY ./backend/ /app/
        EXPOSE 8000
        CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
        ```

3.  **Creación de docker-compose.yml:** Se creó un archivo `docker-compose.yml` para definir y orquestar los tres servicios.
    *   **Archivo:** `docker-compose.yml`
    *   **Contenido:**
        ```yaml
        version: '3.9'
        services:
          db:
            image: postgres:15
            # ... (resto de la configuración)
          backend:
            build: .
            # ... (resto de la configuración)
          frontend:
            image: node:20
            # ... (resto de la configuración)
        ```

4.  **Construcción e Inicio de Contenedores:** Se intentó construir e iniciar los servicios.
    *   **Comando ejecutado:** `sudo docker compose up -d --build`

## Resultado y Bloqueo

La ejecución del comando `docker compose up` falló.

*   **Error Registrado:**
    ```
    toomanyrequests: You have reached your unauthenticated pull rate limit. https://www.docker.com/increase-rate-limit
    ```

*   **Análisis del Error:** El entorno de ejecución ha superado la cuota de descargas anónimas de imágenes desde Docker Hub. Esto impide obtener las imágenes base `postgres:15` y `node:20`, bloqueando completamente la creación del entorno Docker.

## Estado Final de la Fase

**La Fase 1 no se ha podido completar debido a un bloqueo del entorno externo (límite de peticiones de Docker Hub).** No es posible continuar con la configuración de Docker sin resolver este problema de autenticación o de límites de descarga.

## Incidente: Bloqueo por límite de descargas de Docker Hub
Durante la construcción de los contenedores en la Fase 1, el entorno se bloqueó por el límite de descarga de imágenes desde Docker Hub.
Esto impide completar la configuración con Docker Compose de manera reproducible.
Se decide continuar con la alternativa previamente aprobada: implementación del flujo de verificación automatizado en GitHub Actions.