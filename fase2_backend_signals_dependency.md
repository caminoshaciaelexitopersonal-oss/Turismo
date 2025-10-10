# Análisis de Dependencias: `signals.py` y `models.py`

Este informe detalla la estructura de dependencias entre `backend/api/signals.py` y `backend/api/models.py` para identificar la causa del bloqueo del servidor durante el arranque.

---

## 1. Análisis de `backend/api/signals.py`

### 1.1. Importaciones

```python
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import (
    Resena,
    Verificacion,
    AsistenciaCapacitacion,
    PrestadorServicio,
    Artesano,
    ScoringRule,
    RespuestaItemVerificacion
)
```

### 1.2. Dependencias de Modelos por Función

Las siguientes funciones (manejadores de señales) dependen de los modelos importados para su ejecución:

-   **`actualizar_puntuacion_por_resena(sender=Resena)`**:
    -   **Lee de**: `Resena`, `PrestadorServicio`, `Artesano`, `ScoringRule`.
    -   **Escribe en**: `PrestadorServicio` o `Artesano` (a través del método `recalcular_puntuacion_total`).

-   **`actualizar_puntuacion_por_verificacion(sender=Verificacion)`**:
    -   **Lee de**: `Verificacion`, `RespuestaItemVerificacion`.
    -   **Escribe en**: `Verificacion` (usando `.update()` para evitar recursión) y `PrestadorServicio` (a través de `recalcular_puntuacion_total`).

-   **`actualizar_puntuacion_por_capacitacion(sender=AsistenciaCapacitacion)`**:
    -   **Lee de**: `AsistenciaCapacitacion`, `ScoringRule`, `CustomUser` (a través de la relación).
    -   **Escribe en**: `PrestadorServicio` o `Artesano` (a través de `recalcular_puntuacion_total`).

-   **`recalcular_puntuacion_al_borrar_asistencia(sender=AsistenciaCapacitacion)`**:
    -   Hereda las dependencias de `actualizar_puntuacion_por_capacitacion`.

-   **`recalcular_puntuacion_al_borrar_verificacion(sender=Verificacion)`**:
    -   Hereda las dependencias de `actualizar_puntuacion_por_verificacion`.

-   **`recalcular_puntuacion_al_borrar_resena(sender=Resena)`**:
    -   Hereda las dependencias de `actualizar_puntuacion_por_resena`.

---

## 2. Análisis de `backend/api/models.py`

### 2.1. Importaciones Relevantes

```python
import os
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from .fields import EncryptedTextField
from django.core.validators import MinValueValidator, MaxValueValidator
```
*(Nota: El archivo es muy grande, se listan las importaciones principales a nivel de módulo)*.

### 2.2. Dependencias Relevantes

-   Los modelos `PrestadorServicio` y `Artesano` contienen un método llamado `recalcular_puntuacion_total()`.
-   Este método llama a `self.save(update_fields=[...])` para persistir los cambios en la puntuación. Esta llamada a `.save()` dispara la señal `post_save` que, aunque no es manejada por una señal en este mismo modelo, es un punto de interacción con el sistema de señales.

---

## 3. Análisis de Dependencia Cruzada y Causa del Bloqueo

-   **Dependencia Directa:** `api/signals.py` importa múltiples modelos desde `api/models.py`. Esta es una dependencia directa y necesaria para que los manejadores de señales puedan operar sobre los modelos correctos.

-   **Dependencia Indirecta (Causa del Ciclo):** `api/models.py` **no importa directamente** ningún módulo que a su vez importe `api/signals.py`.

-   **Hipótesis del Bloqueo:** El problema no parece ser una importación circular clásica de Python (donde A importa B y B importa A), sino un **interbloqueo a nivel de la inicialización de la aplicación Django**. El flujo que causa el cuelgue es el siguiente:
    1.  Django inicia y carga la configuración de la app `api` a través de `api/apps.py`.
    2.  El método `ApiConfig.ready()` ejecuta `import api.signals`.
    3.  Para cargar `api/signals.py`, Python debe primero cargar sus dependencias, principalmente los modelos de `api/models.py`.
    4.  Python comienza a cargar `api/models.py`. Django empieza a construir su registro de modelos.
    5.  En este punto, durante la carga de los módulos y antes de que el registro de aplicaciones de Django esté completamente listo, se produce una condición de bloqueo. La evidencia más fuerte (el cuelgue de `manage.py showmigrations`) sugiere que esta condición está relacionada con un intento de acceso a la base de datos antes de que sea seguro hacerlo.

La causa exacta es sutil, pero está contenida en el proceso de importación que se inicia desde `ApiConfig.ready()`. El sistema entra en un estado de espera del que no puede salir. La solución más común y segura para este tipo de interbloqueos en Django es evitar que las importaciones se resuelvan en el momento de la carga del módulo, moviéndolas al interior de las funciones que las necesitan.