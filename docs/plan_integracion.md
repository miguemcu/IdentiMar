# Plan de integración con el backend (H2)

- **Fecha:** 27 oct 2026
- **Rama:** `feature/h2-integracion` (un commit por paso)
- **Meta:** integración completa hoy; pruebas desde el 28 oct.
- **Backend:** `https://identimar-backend.onrender.com/api/v1` (desplegado por el Equipo 3)

## Criterio

El contrato (`docs/contrato_integracion.yaml`) es la fuente de verdad. Lo que la app hace distinto se adapta al contrato. Lo que el backend hace distinto se documenta en [`discrepancias.md`](discrepancias.md). Ya no hay tiempo de cambiar la API: cuando el backend difiere en algo de lo que la app depende (como el formato de los errores), la app lo toma tal como llega.

## Punto de partida

- **Hecho y verificado (Expo Go, Android):** autenticación simulada, formulario de 3 pasos, seguimiento del resultado, Registros y detalle, Especies y ficha, Perfil, cola "Por validar", validación experta, borrador, fotos locales, cola `pendiente_envio` y caché con la franja "Sin conexión". Detalle en [`estado_actual.md`](estado_actual.md).
- Las pantallas solo usan `src/services/`. `EXPO_PUBLIC_USE_API=true` cambia a `src/services/api/*.api.ts`, que hoy son esqueletos que lanzan `noIntegrada()`.
- **Pendiente:** todo H2, iOS, pruebas funcionales y de usabilidad.

## Lo que se probó del backend desplegado (27 oct, solo lectura)

- `/health` responde `{"status":"ok"}`. CORS abierto.
- Con `http://` responde 301. Se usa **https**, porque un POST redirigido puede perderse.
- Los catálogos responden sin token y con la forma del contrato.

| Tema                   | Contrato                                           | Backend real                                                 | Qué se hace                                                       |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| Condición del organismo | Sin enumerar                                       | `vivo`, `muerto_reciente`, `descompuesto`, `capturado`, `liberado` | Mock con estos códigos (hoy tiene `herido` y `muerto`)            |
| Tipo de ambiente       | Sin enumerar                                       | `dulceacuicola`, `marino`, `arrecife`, `estuarino`, `manglar`, `playa` | Ya coincide con el mock                                           |
| Estados                | 7 estados                                          | Los mismos 7, con `orden` y `es_terminal`                    | Coincide                                                          |
| Especies               | `codigo` tipo `URO_MICR`                           | 9 rayas; códigos mezclados (`Hypanus_guttatus`, `DASYA_AME`)  | Mock con los códigos reales; documentar la mezcla                 |
| Cuerpo de error        | `{codigo, mensaje, detalles[{campo, problema}]}`   | `{"error": {codigo, mensaje, detalles[{campo, mensaje}]}}`   | **La app lo lee tal como llega**; documentar                      |
| Códigos de error       | kebab-case (`no-autenticado`)                      | Mayúsculas (`NO_AUTENTICADO`, `VALIDACION`)                  | La app decide por el status HTTP, no por el código; documentar   |
| Mensajes de validación | En español                                         | En inglés (`"Required"`)                                     | La app muestra textos propios por campo; documentar               |
| 400 en inicio de sesión | No definido                                        | Existe                                                       | Manejarlo y marcar los campos                                     |
| Cuentas de prueba      | Ejemplo `ana.torres@ejemplo.co`                    | No existe                                                    | Registrar cuentas propias                                         |

## Acordado con el Equipo 3 (27 oct)

- **Cuenta experto:** registramos una cuenta nueva y el Equipo 3 le asigna el rol `experto`.
- **Errores:** se capturan tal como los envía el backend.
- **Modelo:** el modelo del Equipo 2 ya está integrado con la API.
- **Rechazo del experto:** la observación pasa a `no_concluyente`, como ya hace el mock.
- **Plazo:** se adelanta; la integración debe quedar hoy.

## Pasos

Orden pensado para tener primero el flujo de la demo. Cada paso cierra con `npx tsc --noEmit` y `npx expo lint`.

### 1. Ajustes previos

1. **Mock alineado con el backend** (`src/services/mock/mockData.ts`): condiciones y especies con los códigos reales, y errores con la forma que envía el backend, para que el mock se comporte igual que la API.
2. **Lectura de errores** (`src/services/errores.ts`):
   - `mensajeError` y `erroresAuth` leen `detalles[].mensaje`. Muestran un texto propio en español por campo, no el texto del backend.
   - 400 en inicio de sesión: marcar los campos, como en el registro.
3. **401 en la cola de envío:** cierra la sesión con el aviso de sesión vencida, igual que el resto de pantallas, y conserva cola y borrador.
4. Actualizar `docs/discrepancias.md` (estado real de cada fila y la tabla de arriba) y la línea de condiciones en `docs/Dod.md`.

### 2. Cliente HTTP

1. **`EXPO_PUBLIC_API_URL`** en `.env.example` (https de Render), leída en un solo lugar: `src/services/api/config.ts`.
2. **`src/services/api/http.ts`**, un `fetch` envuelto con:
   - JSON y `multipart/form-data`. En multipart no se fija `Content-Type` a mano.
   - `Authorization: Bearer` tomado de la sesión guardada.
   - Tiempo de espera con `AbortController` de unos 60 s, porque Render en plan gratuito tarda en despertar. El tiempo agotado y la falta de red se tratan como `ErrorServicio(0)`, igual que en el mock, así la cola y la caché funcionan sin cambios.
   - Errores convertidos a `ErrorServicio(status, cuerpo)`. Se lee el envoltorio `error` y se pasa `detalles[].mensaje` a `problema`.
   - Ante un 401 con token: renueva una sola vez con `/auth/refresh` (una renovación compartida si llegan varias a la vez) y repite la petición. Si la renovación falla, avisa a la sesión.
   - No escribe tokens, datos personales ni coordenadas en los logs.
3. **`src/services/api/sesion.ts`:** guarda `access_token`, `refresh_token` y `expires_in` en `expo-secure-store`. Expone `obtenerToken`, `renovar` y el aviso `alVencer`.
4. **Dependencia:** `npx expo install expo-secure-store` (la pide el DoD).

### 3. Autenticación

- `src/services/api/auth.api.ts`: `registro`, `login`, `refresh`, `obtenerPerfil`.
- `src/contexts/auth-context.tsx`:
  - Al iniciar sesión, los tokens se guardan en secure-store.
  - `logout` borra los tokens y la caché. Si la sesión venció, conserva el borrador y la cola.
  - Al abrir la app se recupera la sesión y se consulta `/auth/perfil`. Sin red, entra con el último usuario guardado, para que la cola espere la señal.
  - El aviso `alVencer` llama a `logout('sesion-vencida')`.
  - El cambio de rol de prueba solo aparece en modo simulado (`MODO_SIMULADO`).

### 4. Catálogos

- `src/services/api/catalogos.api.ts`: los 5 GET, sin token. Usan la caché que ya existe y se sigue filtrando `grupo: raya`.

### 5. Observaciones

- `src/services/api/observaciones.api.ts`:
  - `crearObservacion`: `FormData` con `datos = JSON.stringify(ObservacionInput)` e `imagen = { uri, type, name }`.
  - `listarObservaciones` y `listarPendientes` con `estado`, `pagina` y `tamano`.
  - `obtenerObservacion`.
- Con datos reales, revisar:
  - El seguimiento (`src/hooks/use-seguimiento-observacion.ts`) se detiene al salir de `recibido` y `procesando`.
  - La reconsulta cuando la URL firmada de la imagen vence.
  - `fecha_hora_evento` con offset, `precision_gps_metros` y `datos` como texto JSON. Si el backend espera otra cosa, se documenta.

### 6. Validación experta

- `src/services/api/validacion.api.ts`: `POST /observaciones/{id}/validacion`. Los errores 400, 401, 403, 404 y 409 ya tienen mensaje en `erroresValidacion`.
- Verificar que al rechazar la observación pase a `no_concluyente` y salga de "Por validar". Si sigue apareciendo (la cola incluye `no_concluyente`), se documenta y la app oculta los controles porque ya tiene validación.

### 7. Cola de envío con la API real

- `src/services/local/cola-envio.ts` ya cumple con el orden de creación, pasa 400 y 413 a revisión y no reintenta con 0 o 401. Falta:
  - **Espera creciente** entre reintentos por 500.
  - **Evitar duplicados:** si un envío terminó por tiempo agotado, antes de reenviar se consulta `GET /observaciones` y se compara `fecha_hora_evento` con las coordenadas. El contrato no tiene idempotencia.
- Con el token vencido y sin red, la cola se conserva y se envía después de renovar la sesión.

### 8. Cierre

- Quitar `no-integrada.ts` y el aviso de `src/services/index.ts`. `EXPO_PUBLIC_USE_API` sigue eligiendo entre mock y API sin tocar pantallas.
- Revisar que solo se llamen endpoints del contrato.
- Marcar H2 en `docs/Dod.md` y actualizar `docs/estado_actual.md`.

## Para documentar (del lado del Equipo 3)

- Envoltorio `error`, códigos en mayúsculas y `detalles[].mensaje` en vez de `problema`.
- Mensajes de validación en inglés.
- Códigos de especie mezclados (`Hypanus_guttatus` frente a `DASYA_AME`).
- `info.version: "3"` frente a "v1.0" en la descripción.
- Sin endpoint para editar una validación ni idempotencia en `POST /observaciones`.
- El estado tras `rechazada` (`no_concluyente`) no está en el contrato.

## Verificación

- `npx tsc --noEmit` y `npx expo lint` sin errores en cada paso.
- Con `EXPO_PUBLIC_USE_API=true`, en Expo Go (Android, e iOS si hay equipo):
  1. Registro, inicio de sesión, cerrar y reabrir la app: la sesión sigue activa.
  2. Tres observaciones reales que pasan de `recibido` al resultado del modelo.
  3. Registros, detalle, Especies y ficha con datos reales.
  4. En modo avión: la observación queda "Pendiente de envío" y se envía al volver la señal, una sola vez.
- Con la cuenta experto: cola "Por validar"; confirmar, corregir y rechazar. El detalle del usuario muestra la decisión.
- 401: con el token alterado se renueva solo; si la renovación falla, vuelve a inicio de sesión con el aviso.
- Con `EXPO_PUBLIC_USE_API=false` todo sigue igual que hoy (`scripts/probar-servicios.ts`).
- Los casos se registran en `docs/pruebas/pruebas-funcionales-2026-10-28.md`.
