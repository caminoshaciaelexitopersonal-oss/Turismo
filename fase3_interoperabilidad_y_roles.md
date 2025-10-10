# Fase 3: Arranque, Interoperabilidad y Verificación de Roles

## 1. Contexto del Entorno
- **Fecha:** 2025-10-10
- **Entorno:** Sandbox de desarrollo local
- **Versiones:**
    - Python: 3.12
    - Django: 5.2.6
    - Node.js: 20
    - Next.js: 15.5.4

## 2. Arranque de Servidores y Diagnóstico de Interoperabilidad (BLOQUEO)

### Acciones Realizadas
1.  Se intentó iniciar los servidores de backend y frontend simultáneamente en segundo plano.
2.  Se utilizó el comando `wait-on` para esperar a que ambos servicios estuvieran listos.

### Resultados y Hallazgos (BLOQUEO TÉCNICO)
-   **Fallo de Conexión:** El comando `wait-on` falló repetidamente, indicando que no podía conectarse al servidor del backend (puerto 8000).
-   **Diagnóstico:** Investigaciones posteriores con `jobs` y `curl` confirmaron que, aunque el proceso del servidor de Django existía, se colgaba y dejaba de responder a las peticiones de red tan pronto como el servidor de frontend se iniciaba.
-   **Conclusión del Bloqueo:** Existe un conflicto de recursos o de gestión de procesos en el entorno de ejecución que impide que los servidores de desarrollo de Django y Next.js coexistan de manera estable. No es posible realizar una verificación de interoperabilidad directa.

### Plan de Contingencia Activado
Para poder cumplir con los objetivos de la Fase 3, se ha decidido pivotar a una estrategia de verificación con un servidor simulado.

1.  **Verificación de Roles con MSW:** Se utilizará Mock Service Worker (MSW) para simular las respuestas de la API del backend.
2.  **Pruebas Aisladas del Frontend:** Se realizarán pruebas manuales y con scripts sobre el frontend para validar los flujos de login y redirección de cada rol, basándose en las respuestas predecibles del servidor simulado.

---

## 3. Verificación de Roles (con Entorno Simulado) - BLOQUEO

### Acciones Realizadas
1.  **Refactorización de Mocks:** Se mejoraron los manejadores de MSW para que el endpoint `/auth/login/` devolviera el token y el objeto de usuario en una sola respuesta.
2.  **Refactorización del AuthContext:** Se modificó el `AuthContext` para consumir la nueva respuesta del login, eliminando la necesidad de una segunda llamada a la API y simplificando el flujo.
3.  **Ejecución de Script de Verificación:** Se creó y ejecutó un script de Playwright (`verify_roles.py`) para probar el login y la redirección de los 6 roles.
4.  **Prueba de Aislamiento:** Al persistir el fallo, se creó un segundo script (`verify_admin_login.py`) para aislar el flujo del rol de Administrador y obtener evidencia visual mediante una captura de pantalla.

### Resultados y Hallazgos (BLOQUEO TÉCNICO)
-   **Fallo Persistente de Redirección:** Todos los intentos de login, tanto en el script completo como en el de aislamiento, resultaron en un **fallo de redirección**. La aplicación permanece en la página de login (`/login`) después de un intento de inicio de sesión exitoso.
-   **Evidencia:** El script `verify_admin_login.py` generó la captura `fase3_admin_login_result.png`, que muestra la página de login, confirmando que la redirección no ocurrió.
-   **Diagnóstico Final:** Existe un problema fundamental en la lógica de `AuthContext` o su interacción con el router de Next.js que impide que `router.push()` funcione como se espera después de una autenticación exitosa. A pesar de múltiples refactorizaciones, el problema persiste.

### Tabla de Verificación de Roles
| Rol                               | Usuario          | Resultado Esperado                            | Estado      | Observaciones |
| --------------------------------- | ---------------- | --------------------------------------------- | ----------- | ------------- |
| Turista                           | `turista`        | Redirección a panel “Mi Viaje”.               | ❌ Fallo    | No redirige.  |
| Prestador de Servicios Turísticos | `prestador`      | Acceso al Dashboard de gestión.               | ❌ Fallo    | No redirige.  |
| Artesano                          | `artesano`       | Acceso a su Dashboard correspondiente.        | ❌ Fallo    | No redirige.  |
| Administrador                     | `admin`          | Acceso al Dashboard principal de admin.       | ❌ Fallo    | No redirige.  |
| Funcionario Directivo             | `directivo`      | Acceso al Dashboard de funcionario.           | ❌ Fallo    | No redirige.  |
| Funcionario Profesional           | `profesional`    | Acceso al Dashboard de funcionario.           | ❌ Fallo    | No redirige.  |

---

## 4. Verificación Manual de Roles del Sistema
*Se completará la tabla con los resultados de las pruebas de inicio de sesión para cada rol.*

| Rol                               | Usuario          | Resultado Esperado                            | Estado      | Observaciones |
| --------------------------------- | ---------------- | --------------------------------------------- | ----------- | ------------- |
| Turista                           | `turista_test`   | Redirección a panel “Mi Viaje”.               | 🔄 Verificar |               |
| Prestador de Servicios Turísticos | `prestador_test` | Acceso al Dashboard de gestión.               | 🔄 Verificar |               |
| Artesano                          | `artesano_test`  | Acceso a su Dashboard correspondiente.        | 🔄 Verificar |               |
| Administrador                     | `admin_test`     | Acceso al Dashboard principal de admin.       | 🔄 Verificar |               |
| Funcionario Directivo             | `directivo_test` | Acceso al Dashboard de funcionario.           | 🔄 Verificar |               |
| Funcionario Profesional           | `profesional_test`| Acceso al Dashboard de funcionario.           | 🔄 Verificar |               |

---

## 5. Problemas Detectados
*Se describirán técnicamente los problemas encontrados durante la verificación.*

---

## 6. Conclusiones
*Resumen del nivel de interoperabilidad y recomendaciones para la siguiente fase.*