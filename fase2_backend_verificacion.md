# Fase 2.1: Verificación del Backend (Django)

## Resumen de la Fase
El objetivo de esta subfase es verificar de manera aislada la estabilidad, configuración y funcionamiento del backend de Django. Se asegurará que las dependencias estén correctas, que la base de datos se configure adecuadamente y que los endpoints principales respondan como se espera.

## Acciones Realizadas y Comandos Ejecutados

1.  **Creación del archivo de informe:**
    -   Se creó el archivo `fase2_backend_verificacion.md` para documentar los hallazgos.

2.  **Resolución de problemas de entorno:**
    -   Se encontró un error `ModuleNotFoundError: No module named 'django'` al intentar ejecutar comandos de `manage.py`.
    -   **Comando ejecutado (fallido):** `python backend/manage.py makemigrations api`
    -   **Causa:** El entorno de la sesión de bash no tenía acceso a las dependencias de Python instaladas previamente.
    -   **Solución:** Se reinstalaron las dependencias para asegurar que estuvieran disponibles en el `PYTHONPATH` de la sesión actual.
    -   **Comando ejecutado (solución):** `pip install -r backend/requirements.txt`

3.  **Verificación y Aplicación de Migraciones:**
    -   Se ejecutó `makemigrations` para asegurar que los modelos y las migraciones estuvieran sincronizados.
    -   **Comando ejecutado:** `python backend/manage.py makemigrations api`
    -   **Resultado:** `No changes detected in app 'api'`.
    -   Se aplicaron las migraciones a la base de datos para configurar el esquema.
    -   **Comando ejecutado:** `python backend/manage.py migrate`
    -   **Resultado:** Todas las migraciones se aplicaron correctamente (OK).

## Resultados y Hallazgos

-   **Backend Estable:** El backend de Django es estable, las dependencias se instalan correctamente y los comandos de `manage.py` se ejecutan como se espera.
-   **Base de Datos Configurada:** La conexión a la base de datos funciona y el esquema se ha configurado exitosamente a través de las migraciones.
-   **Advertencias Menores:** Persisten advertencias sobre la configuración de `dj-rest-auth` y `staticfiles`, pero no son críticas para el funcionamiento del backend en esta fase de verificación.

---

## Análisis de endpoint `/api/config/menu-items/`

### Estado de la base de datos
- **Problema:** Se confirmó que el endpoint devolvía una lista vacía `[]`.
- **Investigación:** Se revisó el modelo `MenuItem` y se buscó un script de inicialización.
- **Hallazgo:** Se encontró el comando de gestión `setup_menu.py`, diseñado para poblar la tabla del menú.
- **Acción:** Se ejecutó el comando `python backend/manage.py setup_menu`.
- **Resultado:** La tabla `MenuItem` fue poblada exitosamente con los datos del menú.

### Verificación del modelo y serializer
- **Problema:** Tras poblar la base de datos, el endpoint comenzó a devolver un `Error de Servidor (500)`.
- **Investigación:** Se añadió un manejador de excepciones a la vista `MenuItemViewSet` para capturar el traceback.
- **Hallazgo:** El traceback reveló un `TypeError` porque se estaba intentando asignar una lista directamente a un `related set` (`item.children = []`), y un `AttributeError` posterior porque el serializador esperaba un diccionario donde recibía un objeto `MenuItem`.
- **Solución:**
    1. Se modificó la vista `MenuItemViewSet` para adjuntar los hijos a un atributo temporal (`item.children_data`) que no entra en conflicto con el ORM.
    2. Se reescribió el `MenuItemSerializer` para usar un `SerializerMethodField`, que proporciona una forma robusta y explícita de serializar la estructura recursiva de los `children`.

### Resultados de prueba de endpoint
- **Prueba final:** Se ejecutó `curl http://localhost:8000/api/config/menu-items/` tras las correcciones.
- **Resultado:** El endpoint devolvió exitosamente el JSON con la estructura completa y anidada del menú.

### Conclusión y recomendaciones
- **Diagnóstico:** El problema del menú vacío se debía a que el comando de inicialización `setup_menu` no se había ejecutado. El error 500 posterior fue causado por una implementación incorrecta en el serializador para manejar datos recursivos.
- **Solución:** Se ejecutó el comando de inicialización y se refactorizó el `MenuItemSerializer` para manejar correctamente la serialización anidada.
- **Recomendación:** Asegurar que los scripts de inicialización de datos (`seeds`) se incluyan como parte del proceso de despliegue o configuración inicial del entorno para evitar este tipo de problemas.

---

## Conclusión de la Fase 2.1

La verificación del backend ha sido **exitosa**.  
El sistema base de Django está operativo y, tras la corrección del endpoint `/api/config/menu-items/`, el backend **provee datos funcionales al frontend**.  
Con esto, se da por finalizada la Fase 2.1 y se recomienda avanzar a la **Fase 3: Interoperabilidad y Diagnóstico Funcional**.