# Definition of Done (DoD): IdentiMar MVP

- **Versión:** 1.1
- **Fecha:** 22 oct 2026
- **Fecha objetivo del MVP:** 29 oct 2026 (demo conjunta)
- **Alcance:** Frente A (nueva observación), Frente B (registros y especies), el perfil con nota de certificación y la validación experta con los endpoints del contrato
- **Fuente de verdad:** `docs/contrato_integracion.yaml` (versión 3, tal como está)

Lo que el contrato no define no se implementa. Las limitaciones se registran en `docs/discrepancias.md`. La API no se modifica en este MVP.

**Avance al 22 oct:** las casillas marcadas están implementadas con datos simulados y probadas en Expo Go (Android; falta iOS). El detalle está en [`estado_actual.md`](estado_actual.md).

**Cambios en 1.1:** la validación experta entra al alcance, usando solo `GET /observaciones/pendientes` y `POST /observaciones/{id}/validacion`. La app no define etiquetas ni umbrales de certeza: muestra lo que entregue el backend.

---

## Reglas generales

- Una tarea está terminada cuando cumple todos sus criterios, `npx tsc --noEmit` no tiene errores y se verificó en Expo Go (Android e iOS).
- Las pantallas solo consumen `src/services/`. Nunca importan datos de ejemplo.
- La interfaz está completamente en español, con poca terminología técnica.
- La app maneja solo rayas (`grupo: raya`). Los tiburones no aparecen en la interfaz.
- El registro exige sesión y el listado es solo del usuario, tal como lo define la API.

---

## Cronograma

| Fecha          | Actividad                                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| 22 oct         | Revisión final de H0 y cierre de pendientes de Frente A y B                                                          |
| 23 oct         | H1: offline first en su parte local y simulada (borrador, fotos locales, cola `pendiente_envio`)                     |
| 24 oct         | Cierre de H1: pruebas funcionales internas con el checklist de este documento                                        |
| 25 – 27 oct    | H2: integración real con la API (autenticación, observaciones, catálogos, polling, sincronización offline)           |
| 27 oct (noche) | Congelamiento de funcionalidades. Desde aquí solo se corrigen errores                                                |
| 28 oct         | Pruebas de integración con backend y modelo reales. Pruebas de usabilidad con 3 a 5 personas. Dos ensayos de la demo |
| 29 oct         | Demo conjunta                                                                                                        |

Si el backend no tiene staging listo el 25 oct, H2 se concentra en autenticación y envío de observaciones. Catálogos y sincronización offline pasan a limitación documentada.

---

## H0. Base técnica

**Estado:** terminado salvo el esqueleto `api` de autenticación y catálogos, los mensajes propios para 400 y 409 en inicio de sesión y registro, el `refresh_token` en la sesión y la plantilla de PR.

- [x] Tipos derivados de los schemas del contrato, con nombres de campo en snake_case y enums como union types (`Rol`, `EstadoObservacion`, `DecisionValidacion`).
- [x] Capa de servicios por dominio (auth, observaciones, catálogos) con implementación `mock`.
- [ ] Implementación `api` como esqueleto que lanza un error explícito si se activa.
- [x] Selección `mock`/`api` por variable de entorno, sin tocar pantallas.
- [x] Tokens de Bentos Costero en NativeWind y fuentes Nunito y Source Sans 3 cargadas.
- [x] Componentes base: `Button`, `Card`, `Input`, `Badge`, `ScreenHeader`, `EstadoBadge`.
- [x] `EstadoBadge` cubre los 7 estados del contrato con texto y color en español.
- [x] Navegación con grupos `(auth)` y `(tabs)`, tabs Inicio, Registros, Especies y Perfil, y stack para nueva observación.
- [x] Sesión con usuario y rol. Sin sesión se redirige a login.
- [x] Login y registro con las validaciones del contrato: nombre (3 a 200 caracteres), correo válido, contraseña (8 a 128), teléfono opcional.
- [ ] Errores 400, 401 y 409 mostrados con mensajes en español.
- [ ] El modelo de sesión contempla access token y refresh token.
- [ ] `AGENTS.md` y plantilla de PR existentes.
- [x] No hay textos ni datos de `App.tsx` (mockup web) en el código.

---

## H1. Prototipo simulado

### Frente A. Nueva observación

**Fotografía**

- [x] Captura desde cámara o desde galería.
- [x] Validación antes de enviar: JPEG o PNG, lado mayor ≥ 1280 px. Si no cumple, mensaje claro para volver a tomarla.
- [x] Vista previa con opción de repetir.

**Ubicación**

- [x] `latitud` y `longitud` obligatorias.
- [x] Captura con GPS (`expo-location`). Si el usuario niega el permiso, puede ingresarlas manualmente.
- [x] Latitud entre -90 y 90, longitud entre -180 y 180.
- [x] Si hay GPS, se envía `precision_gps_metros`.

**Fecha y hora**

- [x] `fecha_hora_evento` en ISO 8601 con offset.
- [x] Por defecto la hora del dispositivo, editable.
- [x] No se aceptan fechas futuras. _(Criterio interno; el contrato no lo define.)_

**Datos del organismo**

- [x] `tipo_ambiente` desde `/catalogos/tipos-ambiente`. -> {dulceacuicola, marino, arrecife, estuarino, manglar, playa}
- [x] `condicion_organismo` desde `/catalogos/condiciones-organismo`. Obligatoria. -> {vivo, muerto, herido, muerto reciente, descompuesto}
- [x] `observaciones_usuario` con máximo 2000 caracteres.
- [x] Sin campo de profundidad propio.

**Envío y estados**

- [x] El mock responde 201 y crea la observación en `recibido`.
- [x] Los estados avanzan solos con retardos simulados: `recibido` → `procesando` → (`identificado` | `no_concluyente` | `pendiente_experto`).
- [x] La pantalla de procesamiento muestra el estado real del registro, no pasos ficticios.
- [x] Errores 400 y 413 en español. El 401 lleva a login.

**Resultado**

- [x] `identificado`: especie aceptada y confianza convertida de 0–1 a porcentaje.
- [x] Sin etiquetas ni umbrales de certeza propios: la app solo muestra el `estado` y la `confianza` del backend. Si el contrato llega a incluir una etiqueta, se muestra tal cual.
- [x] `no_concluyente`: mensaje "No se pudo identificar" y opción de volver a fotografiar.
- [x] `pendiente_experto`: mensaje "En revisión por un experto", sin porcentaje final.
- [x] Se indica que la identificación es una sugerencia.

### Frente B. Registros y especies

**Registros**

- [x] Lista solo las observaciones del usuario (`GET /observaciones`).
- [x] Filtro por estado con el parámetro `estado`.
- [x] Paginación con `pagina` y `tamano` (default 20), con carga al llegar al final.
- [x] Cada tarjeta muestra `EstadoBadge`.
- [x] Estados de carga, vacío y error.

**Detalle** (`GET /observaciones/{id}`)

- [x] Imagen, fecha, ubicación, tipo de ambiente, condición del organismo y notas.
- [x] Predicción original: especie propuesta, confianza y versión del modelo.
- [x] Historial de estados en orden cronológico.
- [x] Si hay validación experta, se muestra en solo lectura: decisión, especie final y comentario.
- [x] Al abrir el detalle se consulta de nuevo la API, para que una validación hecha después se vea sin reinstalar ni cerrar la app.
- [ ] Si la URL firmada de la imagen expiró, se vuelve a consultar el detalle.

**Especies**

- [x] Lista desde `/catalogos/especies`, filtrada a `grupo: raya`.
- [x] Búsqueda por nombre común o científico, en el cliente.
- [ ] Ficha con nombre común, nombre científico, código, familia (desde `/catalogos/familias`), descripción e imagen de referencia (`url_imagen_referencia`).
- [x] Identificadores UUID, nunca numéricos.

### Perfil (Frente C reducido)

- [ ] Muestra los datos del usuario en sesión (`GET /auth/perfil`) y su rol.
- [x] Nota visible: "Para certificarte como experto, comunícate con el administrador de IdentiMar." Sin formulario ni flujo de solicitud.
- [x] Cierre de sesión.

### Validación experta (rol `experto` o `administrador`)

- [ ] Cola "Por validar" desde `GET /observaciones/pendientes`, visible solo para `experto` y `administrador`. Con la API real es la única forma de llegar a observaciones de otros usuarios, porque `GET /observaciones` solo devuelve las propias.
- [x] Desde el detalle, el experto registra su decisión con `POST /observaciones/{id}/validacion`:
  - Confirmar la especie propuesta (`confirmada`).
  - Corregirla eligiendo otra de `/catalogos/especies`, filtrada a `grupo: raya` (`corregida`).
  - Marcar "No se puede identificar" (`rechazada`, con `especie_final_codigo` nulo).
- [ ] Comentario opcional, máximo 2000 caracteres.
- [x] Los controles solo aparecen si la observación está en `pendiente_experto` o `no_concluyente` y aún no tiene validación.
- [x] La predicción original se muestra aparte y nunca se sobrescribe.
- [ ] Errores 403 y 409 con mensajes en español.
- [x] En modo simulado, el cambio de rol del perfil permite probar todo el flujo.

### Transversal H1

- [x] El mock simula latencia, error de red y 401 para probar los estados de error.
- [x] Botones con área táctil mínima de 44 px.
- [x] Contraste suficiente para leer en exteriores.

### Offline first (parte 1: local y simulado)

- [ ] **Borrador local:** una observación a medias se guarda al salir de la pantalla y se recupera al reabrir la app.
- [ ] **Fotos locales:** la imagen se copia al almacenamiento de la app, para no depender de la ruta original de la galería.
- [ ] **Cola de envío:** si el mock simula falta de red, la observación queda como `pendiente_envio`. Es un estado **del cliente**, separado de `EstadoObservacion`, con una etiqueta distinta.
- [ ] Al volver la conexión (simulada), la cola se envía en orden de creación.
- [ ] Catálogos y listados se muestran desde caché sin red, con indicador "Sin conexión".

### Criterio de cierre de H1

- [x] Un usuario inicia sesión, crea una observación, la ve pasar de `recibido` a `identificado` y la encuentra en Registros y en su detalle.
- [ ] Una observación creada sin red queda en cola y se envía al volver la conexión.
- [x] La app compila sin errores y corre en Expo Go.

---

## Pruebas funcionales (transversal, 24 y 28 oct)

Se ejecutan con el checklist de H1 y H2. Cada caso se registra con: fecha, persona que prueba, resultado (aprobado, fallido o bloqueado) y, si falla, una descripción y la captura correspondiente.

**Casos mínimos**

- [ ] Registro de sesión y cierre de sesión con cada rol (`usuario`, `experto`, `administrador`).
- [ ] Observación con todos los campos válidos: se crea y muestra en Registros.
- [ ] Observación con latitud fuera de rango: se bloquea antes de enviar.
- [ ] Imagen menor a 1280 px: se rechaza con mensaje claro.
- [ ] Imagen de formato no permitido: se rechaza con mensaje claro.
- [ ] Respuesta 401 durante el envío: se redirige a login sin perder el borrador.
- [ ] Respuesta 413: se muestra el mensaje correspondiente.
- [ ] Resultado `no_concluyente`: se muestra mensaje y opción de volver a fotografiar.
- [ ] Observación validada por experto después del envío: el detalle muestra la decisión sin recargar la app manualmente.
- [ ] Experto confirma, corrige (eligiendo especie) y rechaza observaciones pendientes; cada decisión deja el estado y la validación esperados.
- [ ] Usuario sin rol experto no ve la cola ni los controles de validación.
- [ ] Sin red: la observación queda en cola y se envía al recuperar la conexión, en orden.

**Registro de resultados:** se guarda en `docs/pruebas/` con el nombre `pruebas-funcionales-AAAA-MM-DD.md`.

---

## Métricas de usabilidad (28 oct)

Sesiones con 3 a 5 personas ajenas al desarrollo, que no hayan visto la app antes. Cada persona realiza estas tareas sin ayuda:

1. Crear una observación completa con foto, ubicación y metadatos.
2. Consultar el resultado de una observación anterior.
3. Encontrar la información de una especie.

**Métricas por tarea**

- Tiempo para completar la tarea (en segundos).
- Éxito: completada sin ayuda (sí o no).
- Número de errores o desvíos.
- Calificación subjetiva de 1 a 5 ("¿qué tan fácil fue?").

**Criterios de aceptación**

- [ ] Al menos 3 de 5 personas completan la tarea 1 sin ayuda.
- [ ] El tiempo mediano para la tarea 1 es menor o igual a 3 minutos.
- [ ] Ningún error bloqueante sin resolver al cierre de la sesión.

**Registro:** tabla con las métricas por persona y por tarea, en `docs/pruebas/usabilidad-AAAA-MM-DD.md`. Sin datos personales identificables; se usan códigos (P1, P2…).

---

## H2. Integración con la API real

### Bloqueantes (antes del 25 oct)

- [ ] URL de staging y credenciales de prueba del Equipo 3.
- [ ] Códigos de los catálogos (`tipos-ambiente`, `condiciones-organismo`, `estados`), que el contrato no enumera.
- [ ] Confirmar que `info.version: "3"` es la versión vigente del contrato.
- [ ] Servicio de inferencia del Equipo 2 disponible en staging, o confirmación de que el backend lo simula en ese entorno.

### Criterios

**Autenticación**

- [ ] `api` implementa login, registro, refresh y perfil.
- [ ] El token se guarda con `expo-secure-store`.
- [ ] Ante un 401 se renueva el token automáticamente. Si falla, se cierra la sesión y se limpia la caché.

**Validación experta**

- [ ] `api` implementa `listarPendientes` y `validarObservacion` con manejo de 200, 403 y 409.
- [ ] Los controles del experto dejan de depender del modo simulado.

**Observaciones**

- [ ] Envío con `multipart/form-data`: `datos` (JSON) e `imagen`.
- [ ] Manejo de 201, 400, 401 y 413.
- [ ] Como no hay notificaciones, el estado se consulta con polling a `GET /observaciones/{id}` mientras esté en `recibido` o `procesando`. Con backoff, y se detiene al llegar a otro estado.
- [ ] Listado paginado y detalle reales.

**Catálogos**

- [ ] Consumidos desde la API y guardados en caché local, actualizados al abrir la app con conexión.

**Offline (parte 2: sincronización real)**

- [ ] La cola usa la API real y respeta el orden de creación.
- [ ] Reintentos con backoff. Un 400 no se reintenta: la observación se marca para revisión.
- [ ] Si el token expiró sin red, la cola se mantiene y se envía al renovar la sesión.

**Arquitectura**

- [ ] Cambiar de `mock` a `api` por variable de entorno no requiere cambios en componentes.
- [ ] No se registran datos personales ni coordenadas en los logs.

**Integración**

- [ ] Al menos 3 observaciones reales enviadas de extremo a extremo, verificando persistencia y estados devueltos.
- [ ] Revisión de llamadas: solo se usan endpoints definidos en el contrato.

### Criterio de cierre de H2

- [ ] La app funciona de extremo a extremo con el backend real, incluido el caso sin red.

---

## Demo del 29 oct (lo que debe mostrar la app)

- [ ] Captura o selección de una foto en un teléfono Android.
- [ ] Metadatos completados y envío al backend real.
- [ ] Identificación propuesta por el modelo, con especie, confianza y estado.
- [ ] Caso no concluyente y su manejo en pantalla.
- [ ] Un experto registra su decisión desde la app y el detalle del usuario se actualiza.

---

## Riesgos conocidos

- **Validación experta en la app:** amplía el alcance de la versión 1.0. Usa solo endpoints del contrato, pero depende de que el backend tenga cuentas con rol `experto` en staging.
- **Estado tras `rechazada`:** el contrato no dice a qué estado pasa la observación. El mock la deja en `no_concluyente`; confirmar con el Equipo 3.
- **Duplicados al reintentar:** el contrato no tiene idempotencia. Mitigación: no reintentar un POST hasta confirmar con `GET /observaciones` si la observación ya existe.
- **Registro requiere sesión:** `POST /observaciones` exige token. El modo offline solo funciona con una sesión previa, por lo que podríamos considerar que una vez iniciado sesión, no sea necesario volver a hacerlo cada que se abre la app, solo si expira el token. Adicional: Añadir una nota en la pantalla inicial: si el pescador no tiene conexión, puede tomar la foto con su cámara y al llegar a un lugar con internet (por ser más amigables), la sube de la galería. _(Hecho: nota en Inicio.)_
- **`pendiente_envio` es local:** no pertenece a `EstadoObservacion` ni aparece en el contrato.
- **Plazo:** H2 depende del staging del Equipo 3 y del servicio de inferencia del Equipo 2. Si no están listos el 25 oct, se prioriza el flujo online y el resto queda documentado como limitación.

## Fuera de alcance del MVP

- Certificación como experto dentro de la app (solo nota en el perfil).
- Pestaña "Todos" y listado público.
- Profundidad como campo propio.
- Tiburones.
- Cualquier cambio a la API.
