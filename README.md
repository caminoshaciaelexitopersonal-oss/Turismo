# Proyecto Full-Stack de Turismo en Puerto Gaitán

Este repositorio contiene el código fuente para una plataforma de turismo de Puerto Gaitán, desarrollada con un backend en **Django** y un frontend en **Next.js**. El sistema no solo ofrece un portal informativo, sino que también integra un sofisticado **sistema de agentes de IA con LangChain** para la gestión automatizada de contenido.

## Características Principales

- **Backend con Django Rest Framework:** Provee una API robusta para gestionar prestadores de servicios, atractivos turísticos, publicaciones y más.
- **Frontend Reactivo con Next.js:** Una interfaz de usuario moderna y rápida para una excelente experiencia de navegación.
- **Sistema de Agentes de IA:** Una jerarquía de agentes (Coronel, Capitanes, Tenientes, Sargentos) que automatiza tareas complejas de gestión de datos mediante procesamiento de lenguaje natural.
- **Autenticación Segura:** Implementa un sistema de inicio de sesión basado en tokens.

## Requisitos Previos

- Python 3.10 o superior
- Node.js 18 o superior
- `pip` para la gestión de paquetes de Python
- `npm` para la gestión de paquetes de Node.js

---

## 🚀 Guía de Instalación y Ejecución

Las siguientes instrucciones deben ejecutarse desde el **directorio raíz** del proyecto.

### 1. Configuración del Backend

Primero, configura y ejecuta el servidor de Django.

```bash
# Instala las dependencias de Python
pip install -r backend/requirements.txt

# Ejecuta las migraciones para crear el esquema de la base de datos
python backend/manage.py migrate

# Puebla la base de datos con datos de prueba (categorías y usuarios)
# Este comando ejecuta el script `create_data.py` en el contexto de Django.
python backend/manage.py shell < create_data.py

# Inicia el servidor de desarrollo del backend
# El servidor estará disponible en http://127.0.0.1:8000
python backend/manage.py runserver
```

### 2. Configuración del Frontend

A continuación, configura y ejecuta la aplicación de Next.js.

```bash
# Instala las dependencias de Node.js
npm install --prefix frontend

# Inicia el servidor de desarrollo del frontend
# La aplicación estará disponible en http://localhost:3000
npm run dev --prefix frontend
```

Una vez completados estos pasos, la plataforma estará completamente operativa en tu máquina local.

---

## 🧪 Pruebas del Sistema

### Pruebas Funcionales

Con ambos servidores en funcionamiento, puedes acceder a `http://localhost:3000` en tu navegador para probar la aplicación de forma manual.

**Flujos de usuario clave a verificar:**
- **Visualización y filtrado:** Navega a la sección de "Directorio Turístico" (ruta `/oferta`) y prueba los filtros por categoría.
- **Registro de nuevo usuario:** Navega a la página de inicio de sesión (ruta `/login`) y haz clic en el enlace para registrar una nueva cuenta como "Turista" o "Prestador de Servicios".
- **Inicio de sesión:** Utiliza la página de "Acceso al Sistema" (ruta `/login`) para iniciar sesión. Puedes usar las credenciales del usuario de prueba creado por el script de datos:
  - **Email:** `prestador@example.com`
  - **Contraseña:** `testpassword`
- **Panel de control:** Una vez iniciada la sesión, verifica que el panel de control (`/dashboard`) se muestra correctamente y que los prestadores pueden editar su perfil.

### Pruebas del Agente de IA

El sistema de agentes se puede probar con un script dedicado que simula una orden y ejecuta toda la cadena de mando.

Para ejecutar la prueba, utiliza el siguiente comando desde el **directorio raíz**:

```bash
python test_agent.py
```

La salida en la consola mostrará el plan del agente, las herramientas que ejecuta y el informe final, permitiendo verificar su correcto funcionamiento.

---

## 🧠 Arquitectura del Agente de IA

El sistema de IA utiliza un patrón de diseño jerárquico inspirado en una estructura de mando militar:

1.  **Coronel:** Es el agente principal que recibe una orden general en lenguaje natural. Su función es usar un LLM para descomponer la orden en un plan táctico.
2.  **Capitanes:** Son agentes especialistas para cada área del sistema (ej: `Prestadores`, `Atractivos`). Reciben las tareas del Coronel.
3.  **Tenientes y Sargentos:** Niveles inferiores de agentes que refinan aún más las tareas hasta llegar a una acción concreta.
4.  **Soldados (Herramientas):** Son las funciones finales que interactúan directamente con la base de datos de Django para ejecutar la orden (ej: `crear_perfil_prestador`).

**Nota sobre el LLM:** El sistema está diseñado para usar un modelo de lenguaje grande (como GPT-4o) para la planificación. Si no se proporciona una clave de API de OpenAI (`OPENAI_API_KEY`), los agentes recurrirán a un **plan de contingencia simulado**, lo que permite probar la lógica de ejecución de herramientas sin coste.