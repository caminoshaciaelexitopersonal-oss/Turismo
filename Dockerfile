# Usa una imagen base de Python
FROM python:3.12-slim

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia el archivo de requerimientos al contenedor
COPY ./backend/requirements.txt /app/

# Instala las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código del backend al contenedor
COPY ./backend/ /app/

# Expone el puerto 8000 para que Django pueda ser accedido
EXPOSE 8000

# Comando para correr el servidor de desarrollo de Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]