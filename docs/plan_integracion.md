# Plan de integración con el backend (H2)

- **Creado:** 27 oct 2026 · **Actualizado:** 28 oct 2026
- **Rama:** `feature/h2-integracion` (sale de `develop`; un commit por paso)
- **Meta:** integración completa hoy; pruebas desde el 28 oct.
- **Backend:** `https://identimar-backend.onrender.com/api/v1` (desplegado por el Equipo 3)

## Avance

| Paso | Qué                                   | Estado                                                   | Commits principales                       |
| ---- | ------------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| —    | Subida a Expo SDK 58                  | Hecho; la app se ve bien en Expo Go (Android)            | `805bd9a`                                 |
| 1    | Ajustes previos                       | Hecho                                                    | `88d8597`, `7af5c7c`, `a3e091a`, `4f2823a` |
| 2    | Cliente HTTP y sesión guardada        | Hecho; probado desde el computador                       | `5460068`, `27cc20f`                      |
| —    | Aviso de carga lenta y espera de 90 s | Hecho                                                    | `61f37ba`                                 |
| 3    | Autenticación                         | Hecho; **verificado en Expo Go**                         | `846cd67`, `0475f78`, `2e0cc2c`           |
| 4    | Catálogos                             | Hecho; probado desde el computador                       | `4993711`                                 |
| 5    | Observaciones                         | Hecho; probado desde el computador (2 observaciones reales) | `70e69ff`                              |
| 6    | Validación experta                    | Hecho; probado desde el computador con `e1.experto`      | `1319186`, `15fd7fe`, `5d5c668`           |
| 7    | Cola de envío con la API real         | Hecho; probado en Node con un servicio falso             | `dbf4e8b`                                 |
| 8    | Cierre                                | En curso: esqueleto quitado y endpoints revisados        | `aac9068`                                 |

"Probado desde el computador" significa que el servicio se ejecutó con `npx tsx` contra el backend desplegado; falta recorrerlo en el teléfono.

## Para continuar (si retomas el trabajo)

1. `git checkout feature/h2-integracion && npm install` (usa el `.npmrc` del repo).
2. En `.env`: `EXPO_PUBLIC_USE_API=true` y `EXPO_PUBLIC_API_URL=https://identimar-backend.onrender.com/api/v1`. Arranca con `npm run start:tunel` (ngrok) o `npx expo start -c` en la misma red.
3. Cuentas: `e1.usuario@ejemplo.co` (usuario) y `e1.experto@ejemplo.co` (experto). Las contraseñas no están en el repo; pídelas a quien las creó.
4. Lo siguiente, en orden:
   - **Recorrer en el teléfono** lo de los pasos 4 a 7 (envío, Resultado, Registros, detalle, Especies, ficha, "Por validar", validar y la cola sin señal) y marcarlo en `Dod.md`. Hay una observación `no_concluyente` de `e1.usuario` esperando en "Por validar" para probar la validación desde la app.
   - **Paso 8:** cerrar el DoD y registrar las pruebas funcionales en `docs/pruebas/`.
5. Antes de cada commit: `npx tsc --noEmit`, `npx expo lint` y `npx tsx scripts/probar-servicios.ts` (modo simulado).

**Reglas de trabajo:**

- Las pantallas y el mock usan siempre la forma del contrato. Cualquier diferencia del backend se adapta solo dentro de `src/services/api/` y se anota en [`discrepancias.md`](discrepancias.md) (sección 6).
- Los textos que ve el usuario no usan palabras técnicas como servidor, API, JPEG, píxeles o caracteres. Se dice qué pasó y qué hacer (por ejemplo, "No pudimos conectarnos a nuestro identificador" o "Al menos 8 letras o números"). Los mensajes de error pasan por `src/services/errores.ts`.

## Criterio

El contrato (`docs/contrato_integracion.yaml`) es la fuente de verdad. Lo que la app hace distinto se adapta al contrato. Lo que el backend hace distinto se documenta en [`discrepancias.md`](discrepancias.md). Ya no hay tiempo de cambiar la API: cuando el backend difiere en algo de lo que la app depende, la app lo toma tal como llega.

## Acordado con el Equipo 3 (27 oct)

- **Cuenta experto:** registramos una cuenta nueva y el Equipo 3 le asigna el rol `experto`.
- **Errores:** se capturan tal como los envía el backend.
- **Modelo:** el modelo del Equipo 2 está integrado con la API (confirmado: identificó una raya con 94 %).
- **Rechazo del experto:** la observación pasa a `no_concluyente`, como ya hace el mock.
- **Plazo:** se adelanta; la integración debe quedar hoy.

## Diferencias del backend que la app ya resuelve

Detalle en [`discrepancias.md`](discrepancias.md), sección 6. En resumen:

| Diferencia                                                                         | Dónde se resuelve                    |
| ---------------------------------------------------------------------------------- | ------------------------------------ |
| Errores dentro de `{"error": …}`, con `detalles[].mensaje` y textos en inglés       | `http.ts` y `errores.ts`             |
| Registro y perfil responden `{"usuario": …}`; el registro rechaza `telefono: null`  | `auth.api.ts`                        |
| `/auth/refresh` no devuelve `refresh_token` ni usuario                              | `sesion.ts` (conserva el anterior)   |
| Al crear, pide `tipo_ambiente_codigo` y `condicion_organismo_codigo`               | `observaciones.api.ts`               |
| Observaciones con otra forma (estado objeto, números texto, `imagen.url_firmada`, `prediccion`, `validacion`, `historial`) | `adaptadores.ts` |
| Validación: rechaza `null`, no devuelve el detalle completo, rechazo en `corregido` | `validacion.api.ts`, pantallas y mock |
| Con `http://` responde 301                                                          | `config.ts` usa `https`              |

## Pasos

### 1. Ajustes previos · hecho

- Mock con los códigos reales de condiciones y las 9 especies del backend (mismos UUID y códigos).
- Errores 400 con textos propios en español por campo, también en el inicio de sesión.
- Un 401 al enviar la cola vuelve a inicio de sesión; la cola y el borrador se conservan.
- `discrepancias.md` y `estado_actual.md` al día.
- *Queda por probar en Expo Go:* cuenta sin datos guardados con `EXPO_PUBLIC_MOCK_ERROR=red`, y el 401 de la cola con `EXPO_PUBLIC_MOCK_ERROR=401`.

### 2. Cliente HTTP · hecho

- `src/services/api/config.ts`: `USE_API`, `API_URL` (desde `EXPO_PUBLIC_API_URL`) y `TIEMPO_ESPERA_MS` (90 s).
- `src/services/api/http.ts` (`pedir`): JSON y multipart; sin respuesta o tiempo agotado → `ErrorServicio(0)`, igual que el mock (la cola y la caché lo tratan como "sin conexión"); errores leídos tal como llegan y pasados a la forma del contrato; ante un 401 renueva una sola vez (compartida) y repite; si la renovación es rechazada, avisa con `avisarSesionVencida()`.
- `src/services/api/sesion.ts`: sesión en memoria y, con la API, cifrada con `expo-secure-store` (se carga al primer uso, así el mock corre en Node).
- `src/components/carga-lenta/`: aviso "Esto está tardando un poco" a los 10 s, en todas las pantallas que cargan desde la API.

### 3. Autenticación · hecho

- `auth.api.ts`: registro, inicio de sesión, renovación y perfil.
- `auth-context.tsx`: al abrir la app entra con la sesión guardada sin consultar la red; con señal pide `/auth/perfil` para traer datos al día (un rol nuevo se aplica sin volver a entrar). `logout` borra la sesión y la caché de registros de esa cuenta. Los tokens ya no están en el contexto.
- Perfil actualiza el usuario de la sesión con lo que trae `/auth/perfil`.

### 4. Catálogos · hecho

- `catalogos.api.ts`: los 5 GET sin token, con la caché que ya existía.

### 5. Observaciones · hecho

- `observaciones.api.ts`: envío multipart, listado con filtros, detalle y "Por validar", todo pasado por `adaptadores.ts`.
- El envío espera la inferencia (≈30 s) y responde con el estado final; el seguimiento de Resultado se detiene en la primera consulta.
- El listado no trae foto: `src/hooks/use-foto-observacion.ts` hace que cada tarjeta visible pida el detalle de su observación (en memoria por 50 minutos). Si el Equipo 3 agrega `imagen_url` al listado, el hook deja de consultar solo.

### 6. Validación experta · hecho

- `validacion.api.ts`: `POST /observaciones/{id}/validacion`. Omite `especie_final_codigo` y `comentario` cuando son nulos (el backend rechaza `null`) y, como la respuesta no trae el detalle completo, vuelve a pedir `GET /observaciones/{id}`.
- `adaptadores.ts` lee la validación del backend (`decision` como objeto, `especie_corregida`).
- **Un rechazo termina en `corregido` sin especie**, no en `no_concluyente` como se acordó. La app sigue al backend: Resultado y Registros dicen "No se pudo identificar", Inicio no la cuenta como identificada y el mock hace lo mismo. Falta confirmarlo con el Equipo 3.
- Probado desde el computador con `e1.experto`:
  - Errores: 400, 403 (con `e1.usuario`), 404 y 409 (validar dos veces, o una observación `identificado`).
  - Una corrección real (a *Hypanus americanus*) y un rechazo real. Las dos salen de "Por validar", y el detalle muestra la decisión, la especie, el comentario, el experto y el historial.
- *Falta en Expo Go:* confirmar una predicción. No se ha podido probar contra el backend porque la única `identificado` no admite validación y las pendientes no traían predicción (servicio de visión dormido). Se puede probar con una `pendiente_experto`, cuando el modelo responda con baja confianza.

### 7. Cola de envío con la API real · hecho

- **Sin duplicados.** Un tiempo agotado (`ErrorServicio(0)` con `cuerpo.codigo === 'tiempo-agotado'`) guarda la observación con `quizaEnviada`; lo hacen tanto `use-enviar-observacion.ts` como la cola, si se corta un reenvío.
  - Antes de reenviarla, `procesarCola` consulta `GET /observaciones` y busca una con el mismo instante de `fecha_hora_evento`, creada desde 5 minutos antes de guardarla en la cola. Si existe, la quita sin reenviar.
  - El listado del contrato no trae coordenadas, así que la clave es la fecha y hora del evento al segundo.
  - El aviso para el usuario es "No pudimos conectarnos a nuestro identificador".
- **Espera creciente.** Tras un 500, `proximoIntento` queda a 15 s y luego a 30 s, y el contexto de la cola programa el reintento. Al tercer fallo pasa a revisión. "Enviar ahora" (`forzar`) no espera.
- **Mock:** `EXPO_PUBLIC_MOCK_ERROR=tiempo-agotado` crea la observación pero no entrega la respuesta.
- *Falta en Expo Go:*
  - Con `tiempo-agotado`: la observación debe aparecer una sola vez en Registros tras "Enviar ahora".
  - Con `500`: se reintenta solo a los 15 y a los 30 s.
  - Con la API en modo avión: queda "Pendiente de envío" y se envía una sola vez al volver la señal.

### 8. Cierre · en curso

- ~~Quitar `src/services/api/no-integrada.ts`.~~ Hecho.
- ~~Revisar que solo se llamen endpoints del contrato.~~ Hecho: las 13 rutas están en el contrato.
- Recorrer en Expo Go lo que solo se probó desde el computador o en Node (ver "Falta en Expo Go" en los pasos 4 a 7).
- Marcar H2 en `Dod.md` y actualizar `estado_actual.md` con lo verificado.
- Registrar las pruebas en `docs/pruebas/pruebas-funcionales-2026-10-28.md`.

## Pendiente del Equipo 3

- ~~Asignar el rol experto a `e1.experto@ejemplo.co`.~~ Hecho el 28 oct.
- **Confirmar el estado tras un rechazo:** se acordó `no_concluyente`, pero el backend lo deja en `corregido` sin especie (la app sigue al backend).
- **Devolver un `refresh_token` nuevo** en cada renovación, como promete el contrato: hoy la sesión vence a los 7 días del último inicio de sesión.
- Confirmar la versión del contrato (`info.version: "3"` frente a "v1.0").
- Mantener despiertos el backend y el servicio de visión antes de las pruebas y la demo.
- Lo demás está documentado en `discrepancias.md` (sección 6), sin cambios a la API.

## Verificación final

- `npx tsc --noEmit` y `npx expo lint` sin errores en cada paso.
- Con `EXPO_PUBLIC_USE_API=true`, en Expo Go (Android, e iOS si hay equipo):
  1. Registro, inicio de sesión, cerrar y reabrir la app: la sesión sigue activa. *(Hecho.)*
  2. Tres observaciones reales desde la app que llegan al resultado del modelo.
  3. Registros, detalle, Especies y ficha con datos reales.
  4. En modo avión: la observación queda "Pendiente de envío" y se envía al volver la señal, una sola vez.
- Con la cuenta experto: "Por validar"; confirmar, corregir y rechazar. El detalle del usuario muestra la decisión.
- 401: con el token alterado se renueva solo; si la renovación falla, vuelve a inicio de sesión con el aviso.
- Con `EXPO_PUBLIC_USE_API=false` todo sigue igual que hoy (`scripts/probar-servicios.ts`).
- Los casos se registran en `docs/pruebas/pruebas-funcionales-2026-10-28.md`.
