# IdentiMar

Aplicación móvil para el registro e identificación de batoideos en el Urabá Antioqueño.

> Proyecto Integrador I — Ingeniería de Sistemas
> Universidad de Antioquia

## 📱 Descripción

**IdentiMar** es una aplicación móvil orientada al registro y apoyo en la identificación de batoideos (rayas) observados en el Urabá Antioqueño.

La aplicación busca facilitar el registro de observaciones mediante fotografías y datos básicos de campo, proporcionando una identificación sugerida y permitiendo posteriormente la validación de los registros por usuarios con perfil de experto.

El proyecto se desarrolla en el marco de **Proyecto Integrador I** de Ingeniería de Sistemas de la Universidad de Antioquia, en colaboración con **INVEMAR**.

## 🎯 Objetivo

Desarrollar una herramienta móvil que facilite la recopilación y gestión de registros de batoideos, apoyando los procesos de identificación y validación de observaciones realizadas en campo.

## ✨ Funcionalidades principales

* Registro de observaciones en 3 pasos: foto (cámara o galería), dónde y cuándo (GPS, fecha y hora), y datos del animal.
* Seguimiento del estado de cada observación hasta obtener una identificación sugerida.
* Registros propios con filtro por estado y detalle con historial.
* Catálogo de especies de rayas con buscador y ficha.
* Perfil del usuario con sus cifras y una nota para certificarse como experto.
* Validación de las observaciones que la app no pudo reconocer, por parte de usuarios expertos.
* Uso sin señal: borrador guardado y cola de envío que se envía sola al volver la conexión (requiere haber entrado una vez con conexión).
* Visor de fotos con zoom, para guardarlas en el teléfono o compartirlas.

## 🛠️ Tecnologías

* **React Native** y **Expo** (Expo Router)
* **TypeScript** estricto
* **NativeWind** (Tailwind para React Native)
* **Git / GitHub**

La aplicación consume la API del **Equipo 3**, que a su vez usa el modelo de identificación del **Equipo 2**.

## 🚀 Cómo ejecutarla

Descarga e instala el APK de la aplicación desde [Expo](https://expo.dev/accounts/m.avendano/projects/IdentiMar/builds/b7343aaa-d91f-464f-a8a3-76201ba5215c) (Android).

### Para desarrollar

```bash
npm install
cp .env.example .env   # EXPO_PUBLIC_USE_API=true para usar la API real
npm run start:tunel    # abre en Expo Go desde cualquier red
```

Antes de cada commit: `npx tsc --noEmit` y `npx expo lint`. Las variables, las pruebas desde el computador y la organización del código están en [`docs/estado_actual.md`](docs/estado_actual.md).

## 🎨 Diseño

La interfaz utiliza el sistema visual Bentos Costero, diseñado para proporcionar una experiencia sencilla, clara y adecuada para el uso en dispositivos móviles y contextos de campo. Su identidad cromática combina la claridad de las aguas someras y los fondos arenosos, utilizando un azul océano claro (`#0284C7`) para las acciones principales, un ocre pálido (`#FCD34D`) que evoca la arena costera para destacar elementos secundarios, y una base limpia sobre grises marfil (`#F4F6F8`) y textos en pizarra (`#1E293B`) que garantizan una lectura óptima. Las pantallas principales tienen una franja superior en azul océano oscuro (`#0369A1`), que da buen contraste con el texto blanco, y una tarjeta de acción que cruza hacia la parte blanca.

Principios principales:

* Interfaz completamente en español.
* Navegación sencilla e intuitiva.
* Elementos táctiles fácilmente identificables.
* Buena legibilidad en exteriores.
* Reducción de terminología técnica para usuarios generales.

## 👥 Equipo

Proyecto desarrollado por estudiantes de Ingeniería de Sistemas de la Universidad de Antioquia.

## 📚 Contexto académico

Este proyecto corresponde a **Proyecto Integrador I — 2026-2** del programa de Ingeniería de Sistemas de la Universidad de Antioquia.

## 🚧 Estado del proyecto

La aplicación está integrada con la API del Equipo 3 y el modelo de identificación del Equipo 2, y el APK del MVP (29 de octubre de 2026) ya está disponible. Las pruebas funcionales y las de usabilidad (5 personas, tiempo mediano de 41 s para registrar una raya) están registradas. El detalle está en [`docs/estado_actual.md`](docs/estado_actual.md).

## 📄 Documentación

* [`docs/estado_actual.md`](docs/estado_actual.md): cómo va la app hoy y qué falta.
* [`docs/Dod.md`](docs/Dod.md): criterios de terminado (Definition of Done) del MVP.
* [`docs/pruebas/`](docs/pruebas/): pruebas funcionales y de usabilidad.
* [`docs/plan_integracion.md`](docs/plan_integracion.md): registro de la integración con el backend (cerrado).
* [`docs/contrato_integracion.yaml`](docs/contrato_integracion.yaml): contrato OpenAPI con la API (Equipo 3).
* [`docs/discrepancias.md`](docs/discrepancias.md): diferencias entre el mockup, el contrato y el backend desplegado.
* [`AGENTS.md`](AGENTS.md): reglas de trabajo y del sistema de diseño.
