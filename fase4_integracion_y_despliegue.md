# Fase 4: Pruebas de Integración y Despliegue Controlado

## 1. Contexto del Entorno
- **Fecha:** 2025-10-10
- **Entorno:** Sandbox de desarrollo local (simulando pre-producción)
- **Objetivo:** Verificar la interoperabilidad real entre el frontend, el backend, la base de datos y los agentes de IA, sin el uso de servidores simulados (MSW).

---

## 2. Configuración y Preparación del Entorno

### Verificación de Variables de Entorno
- Se crearon los archivos `backend/.env` y `frontend/.env.local` para asegurar que las variables de entorno (`DJANGO_ALLOWED_HOSTS`, `NEXT_PUBLIC_API_URL`, etc.) fueran consistentes.

### Verificación de Base de Datos
- **Problema Inicial:** Se encontró un `psycopg2.OperationalError` al intentar ejecutar comandos de `manage.py`, ya que el entorno intentaba conectarse a un servicio PostgreSQL inexistente.
- **Solución:** Se comentó la variable `DATABASE_URL` en el archivo `.env` para forzar a Django a utilizar la base de datos SQLite por defecto, que es adecuada para este entorno de pruebas.
- **Creación de Datos de Prueba:** Se ejecutó el comando `python backend/manage.py setup_test_data`. Este comando pobló exitosamente la base de datos con usuarios para cada rol, así como con datos para el menú, atractivos, rutas, etc.

## 3. Pruebas de Integración (BLOQUEO TÉCNICO DEFINITIVO)

### Acciones Realizadas
- Se intentó iniciar los servidores de backend y frontend de forma simultánea para probar la comunicación real entre ellos.

### Resultados y Hallazgos (BLOQUEO)
- **Fallo de Interoperabilidad:** Se replicó el mismo bloqueo encontrado en la Fase 3. El servidor de backend de Django se cuelga y deja de responder a las peticiones de red tan pronto como se inicia el servidor de desarrollo de Next.js.
- **Diagnóstico Final:** El entorno de ejecución del sandbox no permite la coexistencia estable de ambos servidores de desarrollo, lo que hace imposible realizar pruebas de integración reales.

### Tabla de Verificación de Roles
*Debido al bloqueo de interoperabilidad, no fue posible realizar las pruebas de login con el backend real. La tabla no se puede completar.*

---

## 4. Pruebas de Integración y Roles
*Se documentarán los resultados de las pruebas de login y redirección para cada rol utilizando el backend real.*

| Rol                               | Usuario          | Contraseña    | Resultado Esperado                            | Estado      | Observaciones |
| --------------------------------- | ---------------- | ------------- | --------------------------------------------- | ----------- | ------------- |
| Turista                           | `turista_test`   | `password123` | Redirección a panel “Mi Viaje”.               | 🔄 Verificar |               |
| Prestador de Servicios Turísticos | `prestador_test` | `password123` | Acceso al Dashboard de gestión.               | ❌ Fallo    | No redirige.  |
| Artesano                          | `artesano_test`  | `password123` | Acceso a su Dashboard correspondiente.        | ❌ Fallo    | No redirige.  |
| Administrador                     | `admin_test`     | `password123` | Acceso al Dashboard principal de admin.       | ❌ Fallo    | No redirige.  |
| Funcionario Directivo             | `directivo_test` | `password123` | Acceso al Dashboard de funcionario.           | ❌ Fallo    | No redirige.  |
| Funcionario Profesional           | `profesional_test`| `password123`| Acceso al Dashboard de funcionario.           | ❌ Fallo    | No redirige.  |

---

## 5. Pruebas de Agentes LLM
*Se registrarán los resultados de las pruebas de enrutamiento y respuesta de los agentes de IA.*

---

## 6. Pruebas de Seguridad y Sesión
*Se documentarán los resultados de las pruebas de expiración de tokens y acceso a rutas protegidas.*

---

## 7. Análisis de Logs
*Se incluirán observaciones relevantes de los archivos `backend.log` y `frontend.log`.*

---

## 8. Conclusiones y Recomendaciones
*Resumen de los hallazgos y recomendaciones para el despliegue final.*