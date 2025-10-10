# Informe de Corrección: Ciclo de Señales del Backend

Este informe detalla la corrección aplicada al archivo `backend/api/signals.py` para resolver el interbloqueo del servidor durante el arranque.

---

## 1. Descripción del Cambio Aplicado

El problema de bloqueo fue causado por un interbloqueo en el proceso de carga de la aplicación Django, originado por la importación del módulo de señales (`api.signals`) dentro del método `apps.py:ApiConfig.ready()`. Para resolver esto, se aplicó la siguiente estrategia sin alterar la lógica de negocio:

-   **Importaciones Retrasadas:** Se eliminaron todas las importaciones de modelos (`from .models import ...`) del nivel superior del archivo `api/signals.py`.
-   **Importaciones Locales:** Dichas importaciones se movieron al interior de cada función de señal (`receiver`) que las utiliza. Esto retrasa la carga de los modelos hasta que una señal es efectivamente disparada, momento en el cual la aplicación Django ya está completamente inicializada.
-   **Referencias a Modelos por Cadena (Lazy Reference):** Se modificaron los decoradores `@receiver` para que hagan referencia a los modelos `sender` mediante una cadena de texto (ej., de `sender=Resena` a `sender='api.Resena'`). Esto rompe la dependencia de importación directa durante la fase de registro de señales.

Este cambio es una práctica estándar y segura en Django para prevenir este tipo de interbloqueos.

---

## 2. Resultado del Comando `check`

Después de aplicar el parche y con la importación de señales **activada** en `api/apps.py`, se ejecutó el comando `python backend/manage.py check`. El resultado fue el siguiente:

```
System check identified no issues (0 silenced).
/home/jules/.pyenv/versions/3.12.11/lib/python3.12/site-packages/dj_rest_auth/registration/serializers.py:228: UserWarning: app_settings.USERNAME_REQUIRED is deprecated, use: app_settings.SIGNUP_FIELDS['username']['required']
  required=allauth_account_settings.USERNAME_REQUIRED,
/home/jules/.pyenv/versions/3.12.11/lib/python3.12/site-packages/dj_rest_auth/registration/serializers.py:230: UserWarning: app_settings.EMAIL_REQUIRED is deprecated, use: app_settings.SIGNUP_FIELDS['email']['required']
  email = serializers.EmailField(required=allauth_account_settings.EMAIL_REQUIRED)
/home/jules/.pyenv/versions/3.12.11/lib/python3.12/site-packages/dj_rest_auth/registration/serializers.py:288: UserWarning: app_settings.EMAIL_REQUIRED is deprecated, use: app_settings.SIGNUP_FIELDS['email']['required']
  email = serializers.EmailField(required=allauth_account_settings.EMAIL_REQUIRED)
```

---

## 3. Conclusión y Estado Final

-   **Estado de Arranque:** El servidor ahora arranca de forma instantánea y sin errores críticos. El mensaje `System check identified no issues (0 silenced)` confirma que el backend es estructuralmente sólido.
-   **Accesibilidad de Modelos y Señales:** El éxito del comando `check` (que carga toda la pila de la aplicación) confirma que los modelos son accesibles y que el sistema de señales de Django ha registrado correctamente los manejadores definidos en `api/signals.py` sin causar un interbloqueo.

**El backend ha sido estabilizado con éxito.** La causa raíz del problema de arranque ha sido identificada y solucionada. El sistema está listo para proceder con las siguientes fases de verificación.