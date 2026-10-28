# Estado actual de la app (28 oct 2026)

Resumen de cómo está IdentiMar en `develop` (con la integración H2, #19) y en la rama **`feature/foto-zoom`**, que agrega el visor de fotos. El avance contra el DoD está marcado en [`Dod.md`](Dod.md); los pasos de la integración, en [`plan_integracion.md`](plan_integracion.md); las diferencias con el contrato y con el backend, en [`discrepancias.md`](discrepancias.md).

- **Datos:** la app funciona con dos modos, que se eligen con `EXPO_PUBLIC_USE_API`:
  - `false` (por defecto): datos simulados (mock), como hasta H1.
  - `true`: API real en `https://identimar-backend.onrender.com/api/v1`. Integrados: autenticación, catálogos, observaciones, validación experta y cola de envío. Verificado en Expo Go el flujo en línea completo; **falta** verificar en el teléfono el caso sin red con la API.
- **SDK:** Expo SDK 58 (React Native 0.88) desde el 27 oct. La app se revisó en Expo Go (Android) con SDK 58 y se ve bien.
- **Verificado en:** Expo Go en Android. Falta probar en iOS.
- **Calidad:** `npx tsc --noEmit`, `npx expo lint` y `npx expo-doctor` sin errores; `scripts/probar-servicios.ts` pasa con `EXPO_PUBLIC_MOCK_ERROR` vacío; el bundle de Android (`expo export`) compila.

---

## Con la API real (`EXPO_PUBLIC_USE_API=true`)

| Función                                                     | Estado                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Registro, inicio de sesión, perfil, cerrar sesión           | **Verificado en Expo Go (Android)**                                                      |
| La sesión sigue abierta al cerrar y reabrir la app           | **Verificado en Expo Go (Android)**                                                      |
| Renovación del token ante un 401; si falla, vuelve a entrar  | Probado contra el backend desde el computador; no se ha forzado en el teléfono           |
| Catálogos (especies, familias, ambientes, condiciones, estados) | **Verificado en Expo Go (Android)**                                                  |
| Enviar observación, Resultado, Registros (con fotos), filtro, detalle | **Verificado en Expo Go (Android)**, con respuesta del modelo                  |
| Aviso "Esto está tardando un poco" (a los 10 s)             | En código; aparece si el envío o una carga pasa de 10 s                                 |
| Cola "Por validar"                                          | **Verificado en Expo Go (Android)**: la observación no concluyente aparece y sale al validarla |
| Validación experta (confirmar, corregir, rechazar)          | **Verificado en Expo Go** corregir. Desde el computador: rechazar y los errores 400, 403, 404 y 409. Falta confirmar una predicción |
| Cola de envío sin señal                                      | Usa la API real; tras un tiempo agotado revisa si la observación ya llegó antes de reenviarla, y tras un 500 reintenta a los 15 y 30 s. Probado en Node; **falta en el teléfono** |
| Rechazo del experto                                          | Se muestra "No identificable" y la nota "Un experto revisó esta foto, pero no pudo identificar la especie" |

**Cuentas de prueba en el backend** (las contraseñas no van en el repo; pedirlas a quien las creó):

| Correo                  | Rol actual | Para                                                            |
| ----------------------- | ---------- | --------------------------------------------------------------- |
| `e1.usuario@ejemplo.co` | usuario    | Probar el flujo del observador. Tiene varias observaciones de prueba |
| `e1.experto@ejemplo.co` | experto    | Probar "Por validar" y la validación                            |

**Cómo se comporta con el backend real:**

- **El envío tarda ≈30 s:** el backend espera a que el modelo termine antes de responder, y Resultado llega con el estado final.
- **Servicio de visión dormido:** se duerme con frecuencia, y entonces la observación queda "No se pudo identificar" ("Servicio de visión no disponible" en el historial). Conviene despertarlo antes de una prueba o demo.
- **Rechazo del experto:** la observación queda `corregido` sin especie (se había acordado `no_concluyente`; se decidió dejarlo como lo hace el backend). Para que nadie crea que ya se identificó, la app muestra la etiqueta "No identificable" en vez de "Corregido", con la nota "Un experto revisó esta foto, pero no pudo identificar la especie", y no la cuenta como identificada.
- **Render tarda en despertar:** el tiempo máximo de espera es de 90 s, y a los 10 s aparece el aviso amigable.
- **Fotos en las listas:** el listado del backend no trae la foto, así que cada tarjeta visible de Registros e Inicio pide el detalle de su observación para mostrarla (se guarda en memoria unos 50 minutos). Mientras llega, o sin señal, se ve el ícono de cámara. Se pidió al Equipo 3 incluirla en el listado, como dice el contrato.
- **Sesión de 7 días como máximo:** el backend no entrega un `refresh_token` nuevo al renovar, así que pasados 7 días desde el último inicio de sesión hay que volver a entrar (pedido al Equipo 3 en `discrepancias.md`).
- **Al cerrar sesión** se borran la sesión guardada y la copia de los registros de esa cuenta; la cola de envío y, si la sesión venció, el borrador se conservan.

---

## Lo que puede hacer un usuario (en los dos modos)

1. **Entrar o crear cuenta.** Con datos simulados, cualquier correo y contraseña válidos entran y hay cuentas de prueba para cada rol. Si el correo ya está registrado o un dato no es válido, el mensaje aparece en español junto al campo.
2. **Inicio.** Saludo, cifras de sus registros (Registros, Identificadas, En revisión), sus últimos registros, una nota para cuando no hay internet en el mar y una raya del catálogo que cambia cada día.
3. **Registrar una raya en 3 pasos.**
   - **Foto:** cámara o galería. Se valida que sea JPG, PNG o WEBP, de al menos 32 px por lado y hasta 10 MB (acordado con los Equipos 2 y 3 el 28 oct).
   - **Dónde y cuándo:** ubicación por GPS (o a mano si no hay permiso) y fecha y hora del teléfono, editables y sin fechas futuras.
   - **Sobre el animal:** tipo de ambiente, estado del animal y notas (máximo 2000 caracteres).
4. **Ver el resultado:**
   - **Identificado:** especie y qué tan segura está la app, como sugerencia.
   - **En revisión por un experto:** sin porcentaje.
   - **No se pudo identificar:** con opción de tomar otra foto.
5. **Consultar sus registros**, filtrar por estado y abrir el detalle: foto, datos, sugerencia de la app (con versión del modelo), validación del experto (si la hay) e historial. Si la foto no carga, el detalle se vuelve a pedir una vez y, si sigue fallando, se ofrece reintentar.
6. **Consultar el catálogo de especies** (solo rayas; hoy las 4 que reconoce el modelo) con buscador y ficha con imagen de referencia, descripción, código y familia.
7. **Ver una foto en grande** (`feature/foto-zoom`): al tocar la foto del detalle de un registro o de la ficha de una especie se abre a pantalla completa. Se puede pellizcar para acercar (hasta 5×), arrastrar para recorrerla y tocar dos veces para acercar o volver. Desde ahí se puede **guardar en el teléfono** o **compartir** (guardar en Fotos, WhatsApp, correo). En Android, Expo Go no tiene acceso completo a la galería: "Guardar en el teléfono" puede fallar ahí y sugiere usar "Compartir"; en la app instalada (APK) funciona.
8. **Perfil:** datos (desde `GET /auth/perfil`; si falla, los de la sesión), rol, cifras, nota para certificarse como experto y cerrar sesión. Si el rol cambió en el servidor (por ejemplo, ahora es experto), la app lo usa sin volver a entrar.
9. **Usar la app sin señal.**
   - **Borrador:** el formulario a medias se guarda en el teléfono (uno por cuenta) y se recupera al volver a entrar, incluso tras cerrar la app. Se borra al enviar, con "Empezar de nuevo" o al cerrar sesión a mano; si la sesión vence, se conserva.
   - **Foto:** se copia a la carpeta de la app al elegirla. Si la copia falla, aparece un aviso y el flujo sigue. De las fotos enviadas se conservan las 20 más recientes.
   - **Cola de envío:** sin red, la observación queda "Pendiente de envío" en Registros y se envía sola, en orden, al entrar, al volver la señal o al volver a la app (o con "Enviar ahora"). Con 400, 413 o sin foto pasa a "Requiere revisión"; con 500 u otros errores reintenta solo a los 15 y 30 s y, al tercer intento, pasa a revisión. Si el envío se cortó porque el servidor tardó, revisa si la observación ya llegó antes de reenviarla. Si la sesión venció, vuelve a inicio de sesión y la cola se envía al volver a entrar.
   - **Sin conexión:** Inicio, Registros, Especies, la ficha y el paso 3 del formulario muestran lo último guardado con la franja "Sin conexión" y se recargan solos al volver la señal.

Si la sesión vence (401) y no se puede renovar, la app vuelve a inicio de sesión con el aviso "Tu sesión venció, vuelve a entrar."

**Experto o administrador:** desde Perfil abre la cola "Por validar". En el detalle de una observación pendiente o no concluyente puede confirmar la especie, corregirla eligiendo otra del catálogo o marcarla como "No se puede identificar", con un comentario opcional (máximo 2000 caracteres). Funciona con datos simulados y con la API.

---

## Cómo probarlo

```bash
npm install
cp .env.example .env
npx expo start -c
```

Para abrirla en Expo Go desde otra red: `npm run start:tunel`. Con SDK 58, `npx expo start --tunnel` usa el túnel firmado de Expo, que exige iniciar sesión en una cuenta de Expo; el script usa ngrok como antes.

`npm install` usa el `.npmrc` del repo (`legacy-peer-deps`): `datetimepicker` declara como opcional `react-native-windows`, que pide React Native 0.85 y choca con la 0.88 de SDK 58. No usamos Windows.

| Variable                     | Valores                                                         | Para qué                                                     |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| `EXPO_PUBLIC_USE_API`        | `false` (por defecto) · `true`                                  | `true` usa la API real                                       |
| `EXPO_PUBLIC_API_URL`        | `https://identimar-backend.onrender.com/api/v1` (por defecto)   | URL de la API. Siempre con `https`                           |
| `EXPO_PUBLIC_MOCK_ERROR`     | vacío · ver la lista de abajo                                   | Solo con datos simulados: fuerza un error                    |
| `EXPO_PUBLIC_MOCK_RESULTADO` | vacío · `identificado` · `pendiente_experto` · `no_concluyente` | Solo con datos simulados: fuerza el resultado                |

Valores de `EXPO_PUBLIC_MOCK_ERROR` (uno a la vez; reiniciar con `-c` al cambiarlo):

- **Enviar observación y cola de envío:** `400` · `401` · `413` · `500` · `foto-ausente` (la foto de una observación en cola ya no está en el teléfono) · `tiempo-agotado` (la observación se crea pero la respuesta no llega; la cola revisa si ya existe antes de reenviarla)
- **Copia de la foto:** `copia-foto` (el teléfono no deja guardar la copia)
- **Sin conexión en toda la app** (envío, catálogos, listado y detalle): `red`
- **Registro:** `409` · `400-auth` (el correo `ya.registrado@ejemplo.co` siempre da 409)
- **Seguimiento y detalle:** `401-seguimiento` (la segunda consulta del detalle da 401) · `imagen-vencida` (la primera consulta de cada registro trae una foto que no carga) · `imagen-vencida-siempre`
- **Ficha de especie:** `familias`
- **Perfil:** `perfil` · `401-perfil`
- **Cola "Por validar":** `pendientes` · `403-pendientes`
- **Validación experta:** `403-validacion` · `409-validacion`

Con `EXPO_PUBLIC_MOCK_RESULTADO=pendiente_experto`, se envía una observación, se cambia a **Experto** en Perfil y se valida desde el detalle. Los datos simulados viven en memoria: al recargar la app se pierden las observaciones nuevas y la sesión (con la API, la sesión sí se conserva).

**Probar la capa API desde el computador** (sin teléfono): los servicios `src/services/api/*` se pueden ejecutar con `npx tsx` contra el backend. `expo-secure-store` y `expo-file-system` no cargan en Node, así que hay que reemplazarlos por versiones en memoria (con `--require` para `require` y con un cargador ESM para los `import()` dinámicos). Así se probó todo lo marcado "desde el computador".

**Ver el flujo en Metro:** solo en desarrollo (`__DEV__`), el cliente HTTP escribe una línea por petición, por ejemplo `[IdentiMar] POST /observaciones → 201`, o con el código y los campos si falla. Si `fetch` falla antes de salir del teléfono, escribe `[IdentiMar] fetch falló: …`. No escribe valores, tokens ni coordenadas, y en un build de producción (APK de release) no se ejecuta. Con `j` en la terminal de Metro se abren las herramientas de React Native.

---

## Cómo está organizado el código

| Carpeta                  | Contenido                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`               | Rutas (Expo Router): `(auth)`, `(tabs)`, `nueva-observacion`, `observaciones/[id]`, `observaciones/resultado/[id]`, `especies/[id]`, `validacion/pendientes` |
| `src/components/ui/`     | Componentes de la identidad visual: `HeroHeader`, `ActionCard`, `StatTile`, `Chip`, `Icono`, `Avatar`, `Card`, `Button`, `EstadoBadge`… |
| `src/components/`        | `sin-conexion/` (franja "Sin conexión"), `carga-lenta/` (aviso a los 10 s), `nueva-observacion/`, `cola-envio/`                         |
| `src/services/`          | Interfaces por dominio, `mock/` y `api/`. Las pantallas solo usan esta capa. `errores.ts` traduce los errores a mensajes en español     |
| `src/services/api/`      | `config.ts` (URL, modo, espera de 90 s), `http.ts` (cliente con renovación del token), `sesion.ts` (sesión cifrada con `expo-secure-store`), `adaptadores.ts` (pasa las observaciones del backend a la forma del contrato) y un servicio por dominio |
| `src/services/local/`    | Borrador, fotos, cola de envío, caché y detección de red                                                                                |
| `src/contexts/`          | `auth-context` (sesión y usuario) y `cola-envio-context` (envío de la cola)                                                             |
| `src/hooks/`             | `useSeguimientoObservacion` (consulta el estado con esperas crecientes), `useResumenRegistros`, `useEnviarObservacion`, `useBorradorObservacion` |
| `src/types/`             | Tipos con la forma del contrato (snake_case, UUID, estados del contrato)                                                                |
| `src/constants/`         | Formato de fechas (hora local, 12 horas) y búsqueda de especies                                                                         |

**Regla de la capa API:** las pantallas y el mock usan siempre la forma del contrato. Lo que el backend envía o pide distinto se adapta solo dentro de `src/services/api/` (por ejemplo, `adaptadores.ts`, el teléfono omitido en el registro o los `*_codigo` al crear) y se anota en `discrepancias.md`.

**Identidad visual:** sistema Bentos Costero. Las franjas superiores usan `ocean-dark` porque el texto blanco sobre `ocean` no alcanza el contraste mínimo (4.1:1 frente a 4.5:1). Las tarjetas con color usan fondos opacos para que la sombra de Android no se vea a través. Los íconos usan SF Symbols en iOS y Material Symbols en Android, coloreados con clases de NativeWind.

**Dependencias agregadas:** `@react-native-community/datetimepicker` (fecha y hora), `expo-file-system` (datos locales), `expo-network` (detección de red), `expo-secure-store` (sesión cifrada; se carga solo con la API), `expo-media-library` (guardar fotos en la galería) y `expo-sharing` (compartir fotos).

---

## Pendiente

**H2** (detalle en [`plan_integracion.md`](plan_integracion.md))

- **Sin red con la API, en el teléfono:** modo avión al enviar → "Pendiente de envío" → se envía una sola vez al volver la señal.
- **Con el mock, en el teléfono:** `EXPO_PUBLIC_MOCK_ERROR=tiempo-agotado` (la observación aparece una sola vez tras "Enviar ahora") y `500` (reintenta solo a los 15 y 30 s).
- **Validación:** confirmar una predicción (necesita una `pendiente_experto` con predicción) y rechazar desde el teléfono.
- Pruebas que no se pueden forzar con el mock y ahora sí con la API: 401 del inicio de sesión (contraseña equivocada), 413 (foto muy pesada), renovación del token (esperar 1 hora o alterar el token) y el 409 real de la validación.
- Registrar las pruebas funcionales en `docs/pruebas/`.

**Siguiente rama (propuesta)**

- ~~**Ver la foto en grande**~~ con zoom, guardar y compartir: hecho en `feature/foto-zoom` (falta verificar en el teléfono).
- **APK:** definir cómo se compila e instala (EAS Build, perfil de vista previa o de producción) y el ícono de la app (otro compañero trabaja en el logo).

**Por revisar del modo simulado y sin conexión** (sin marcar como hecho)

- **Cuenta sin datos guardados:** con `red` y una cuenta que nunca abrió Registros, Inicio y Registros deben mostrar "Aún no hay datos guardados…" y Reintentar, sin errores técnicos.
- **401 en la cola:** ahora vuelve a inicio de sesión. Verificar en Expo Go con `EXPO_PUBLIC_MOCK_ERROR=401` y una observación en cola.
- Cola "Por validar": que un observador que llegue por la ruta directa vea "Esta sección es para expertos". Desde la interfaz no se puede llegar.
- Validación: la tarjeta roja que aparece cuando el 409 recarga una observación ya validada, el 404 y el 400. No hay valor para forzarlos en el mock.
- La prueba de la cola con error 500 tres veces se verificó sin los mensajes de Metro: que el intento 3 venga de "entrar" se deduce de la espera de 10 s, no se observó.
- `scripts/probar-servicios.ts` falla con `EXPO_PUBLIC_MOCK_ERROR=red` (esperado: los catálogos responden sin conexión); pasa sin `red`.
- La franja "Sin conexión" desaparece al desactivar el modo avión solo si `expo-network` avisa el cambio de red.

**Limitaciones conocidas**

- Perfil y el detalle de una observación no tienen copia: sin conexión, el Perfil muestra "–" en sus cifras y el detalle su mensaje de error.
- La caché, la cola y el borrador se guardan sin cifrar en la carpeta privada de la app (la sesión sí va cifrada).
- Las páginas 2 en adelante de Registros y los filtros por estado no tienen copia.
- Las URLs firmadas de las fotos vencen en 1 hora; si el detalle trae una vencida, se vuelve a pedir.
- Registros se recarga al cambiar de cuenta o de rol de prueba.

**Pruebas:** las pruebas funcionales y de usabilidad del DoD aún no se han registrado en `docs/pruebas/`.

<details>
<summary>Historial de H0, H1 y modo sin conexión (parte 1)</summary>

- **H0** (`feature/cierre-h0`): esqueletos `api` por dominio y `EXPO_PUBLIC_USE_API`; mensajes para 400, 401 y 409 en inicio de sesión y registro; la sesión guarda `access_token`, `refresh_token` y `expires_in`. Verificado en Expo Go (Android).
- **H1** (`feature/h1-pendientes`): reconsulta del detalle si la foto venció; ficha con código y familia; Perfil con `GET /auth/perfil`; cola "Por validar"; comentario del experto con mensajes para 403 y 409; 401 durante el seguimiento lleva a inicio de sesión. Verificado en Expo Go (Android).
- **Modo sin conexión, parte 1** (`feature/offline`): borrador local, copia local de la foto, cola `pendiente_envio`, caché de catálogos y listados con la franja "Sin conexión" y límite de 20 fotos enviadas. Verificado en Expo Go (Android), salvo la prueba del límite de fotos.

</details>

---

## Preguntas para el Equipo 3

Las respondidas y las abiertas están en [`discrepancias.md`](discrepancias.md#preguntas-para-el-equipo-3). Respondidas el 27 oct: códigos de los catálogos, estado tras `rechazada` (`no_concluyente`), formato de error (la app lo toma tal cual) y cuenta experto (la asigna el Equipo 3). El 28 oct asignaron el rol experto. Pedidos abiertos: confirmar el estado tras un rechazo (`corregido` en el backend), devolver un `refresh_token` nuevo al renovar y confirmar la versión del contrato.
