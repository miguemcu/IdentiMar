# Discrepancias mockup ↔ contrato ↔ backend

Comparación entre el mockup de Figma (`docs/mockup/`), el contrato OpenAPI del Equipo 3 (`docs/contrato_integracion.yaml`) y el backend desplegado (`https://identimar-backend.onrender.com/api/v1`).

- Mockup ↔ contrato: revisado el 2026-10-07 sobre los modelos de datos y el formulario de nueva observación; estados actualizados el 2026-10-27.
- Backend ↔ contrato: probado el 2026-10-27 (sección 6).
- Columna **Estado**: `pendiente` · `acordado con E3` · `resuelto en la app` · `fuera de alcance`.
- El contrato es la fuente de verdad: lo que la app hace distinto se adapta al contrato; lo que el backend hace distinto se documenta aquí. Como la API ya no cambia antes de la demo, la app toma tal como llega lo que el backend envía distinto (sección 6).

## 1. Formulario de nueva observación

| #   | Tema                    | Mockup                           | Contrato                                                             | Acción en la app                                                            | Estado             |
| --- | ----------------------- | -------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------ |
| 1   | Ubicación               | Texto libre ("Turbo, Antioquia") | `latitud` y `longitud` obligatorias, `precision_gps_metros` opcional | GPS con `expo-location` y ajuste manual si no hay permiso                   | resuelto en la app |
| 2   | Fecha y hora            | "Mañana / Tarde / Noche"         | `fecha_hora_evento` en ISO 8601, obligatoria                         | Hora del teléfono, editable y sin fechas futuras                            | resuelto en la app |
| 3   | Condición del organismo | No existe                        | `condicion_organismo` obligatoria (catálogo)                         | Campo "Estado del animal" desde el catálogo                                 | resuelto en la app |
| 4   | Tipo de ambiente        | Mar / Estuario / Manglar         | `tipo_ambiente` con códigos de `/catalogos/tipos-ambiente`           | Opciones desde el catálogo; códigos confirmados con el backend (sección 6)  | resuelto en la app |
| 5   | Profundidad             | Campo propio (opcional)          | No existe                                                            | Sin campo propio (DoD: fuera de alcance); se puede anotar en las notas      | fuera de alcance   |
| 6   | Notas                   | "Notas adicionales"              | `observaciones_usuario`, máx. 2000 caracteres                        | Límite de 2000 caracteres con contador                                      | resuelto en la app |
| 7   | Imagen                  | Foto de cámara o galería         | JPEG o PNG, lado mayor ≥ 1280 px; error 413 si es muy grande         | Validación de formato, tamaño y peso antes de enviar; mensaje para el 413. Requisitos cambiados el 28 oct (fila 43) | resuelto en la app |

## 2. Resultado, estados y confianza

| #   | Tema                    | Mockup                                  | Contrato                                                                                                 | Acción en la app                                                     | Estado             |
| --- | ----------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------ |
| 8   | Flujo de identificación | Pantalla "Procesando" y luego resultado | Respuesta `201` inmediata; la inferencia corre en segundo plano                                          | Resultado que consulta el estado real con esperas crecientes         | resuelto en la app |
| 9   | Estados                 | Etiquetas sueltas ("Validado", etc.)    | `recibido`, `procesando`, `identificado`, `no_concluyente`, `pendiente_experto`, `validado`, `corregido` | `EstadoBadge` con texto y color en español para los 7                | resuelto en la app |
| 10  | Confianza               | Porcentaje entero                       | Número entre 0 y 1                                                                                       | Se convierte a porcentaje al mostrar                                 | resuelto en la app |
| 11  | Caso sin resultado      | No contemplado                          | `no_concluyente` y `especie_aceptada` nula                                                               | Pantalla "No se pudo identificar" con opción de tomar otra foto      | resuelto en la app |

## 3. Validación experta

| #   | Tema                    | Mockup                                              | Contrato                                                                                  | Acción en la app                                                    | Estado             |
| --- | ----------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------ |
| 12  | Decisión del experto    | "Porcentaje de validación"                          | `decision` (`confirmada`, `corregida`, `rechazada`), `especie_final_codigo`, `comentario` | Confirmar, corregir (eligiendo especie) o "No se puede identificar" | resuelto en la app |
| 13  | Cola de pendientes      | "Como experto puedes validar cualquier observación" | Cola dedicada (`/observaciones/pendientes`, solo experto o administrador)                 | Cola "Por validar" desde Perfil, solo para experto y administrador  | resuelto en la app |
| 14  | Conservar la predicción | No contemplado                                      | La predicción original del modelo no se sobrescribe                                       | Predicción original y decisión del experto por separado             | resuelto en la app |
| 15  | Rechazo                 | No contemplado                                      | `rechazada` con `especie_final_codigo` nulo; el contrato no dice a qué estado pasa        | Opción "No se puede identificar". Se acordó `no_concluyente`, pero el backend la deja en `corregido` sin especie (fila 39): la app sigue al backend | resuelto en la app |

## 4. Registros, usuarios y certificación

| #   | Tema                       | Mockup                                                       | Contrato                                                       | Acción en la app                                              | Estado             |
| --- | -------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------- | ------------------ |
| 16  | Pestaña "Todos"            | Lista observaciones de todos los usuarios                    | Un usuario común solo ve las suyas (el administrador ve todas) | Sin pestaña "Todos"; Registros muestra solo las propias       | fuera de alcance   |
| 17  | Certificación como experto | Flujo de 4 pantallas (área, años, motivación, revisión)      | **Sin endpoint** de solicitud                                  | Nota en Perfil: "comunícate con el administrador de IdentiMar" | fuera de alcance   |
| 18  | Roles                      | Usuario y experto                                            | `usuario`, `experto`, `administrador`                          | Los tres roles; experto y administrador ven "Por validar"     | resuelto en la app |
| 19  | Autenticación              | Sin pantallas de registro ni inicio de sesión en lo revisado | Registro, login, refresh y perfil                              | Pantallas de inicio de sesión y registro propias              | resuelto en la app |

## 5. Especies

| #   | Tema               | Mockup                                                                   | Contrato                                                                                                  | Acción en la app                                                                                   | Estado             |
| --- | ------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------ |
| 20  | Campos de la ficha | `habitat`, `depth`, `size`, estado de conservación, `regionCount`, color | `codigo`, `nombre_cientifico`, `nombre_comun`, `familia`, `grupo`, `descripcion`, `url_imagen_referencia` | Ficha solo con los campos del contrato                                                             | resuelto en la app |
| 21  | Identificadores    | Numéricos                                                                | UUID, más `codigo` taxonómico (ej. `URO_MICR`)                                                            | `id` UUID y `codigo`                                                                               | resuelto en la app |
| 22  | Grupo              | Solo rayas                                                               | `grupo`: `raya` o `tiburon`                                                                               | La app solo trabaja con rayas (batoideos) según alcance del proyecto UdeA. No se requiere en la UI | resuelto en la app |

## 6. Backend desplegado ↔ contrato

Probado el 2026-10-27 contra `https://identimar-backend.onrender.com/api/v1`. Con `http://` el servidor responde 301; la app usa `https` porque un POST redirigido puede perderse.

| #   | Tema                     | Contrato                                                     | Backend desplegado                                                                     | Qué hace la app                                                          | Estado             |
| --- | ------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------ |
| 23  | Cuerpo de error          | `{codigo, mensaje, detalles[{campo, problema}]}`             | `{"error": {codigo, mensaje, detalles[{campo, mensaje}]}}`                             | Lo lee tal como llega y lo convierte a la forma del contrato             | acordado con E3    |
| 24  | Códigos de error         | kebab-case (`no-autenticado`, `validacion-fallida`)          | Mayúsculas (`NO_AUTENTICADO`, `VALIDACION`)                                            | Decide por el status HTTP, no por el código                              | resuelto en la app |
| 25  | Mensajes de validación   | En español                                                   | En inglés (`"Required"`)                                                               | Muestra textos propios en español por campo                              | resuelto en la app |
| 26  | 400 en inicio de sesión  | No definido (solo 401)                                       | Responde 400 si faltan datos                                                           | Marca los campos, como en el registro                                    | resuelto en la app |
| 27  | Registro y perfil        | `UsuarioPublico`                                             | `{"usuario": UsuarioPublico}` en `POST /auth/registro` y `GET /auth/perfil` (incluye `telefono`) | Acepta las dos formas                                                    | pendiente          |
| 28  | Códigos de catálogos     | No los enumera                                               | Ambiente: `dulceacuicola`, `marino`, `arrecife`, `estuarino`, `manglar`, `playa`. Condición: `vivo`, `muerto_reciente`, `descompuesto`, `capturado`, `liberado` | Mock alineado con estos códigos                                          | resuelto en la app |
| 29  | Códigos de especie       | Ejemplo `URO_MICR`                                           | Desde el 28 oct, solo las 4 especies del modelo, con códigos de nombre científico (`Hypanus_guttatus`) | Usa el `codigo` que llegue; mock con las mismas 4 especies              | resuelto en la app |
| 30  | Textos de los catálogos  | —                                                            | Algunos nombres sin tildes (`Dulceacuicola`, `Raya latigo`). Desde el 28 oct, las especies traen imagen de referencia pública y descripciones nuevas (una con espacios y "\r\n" sobrantes) | Muestra lo que llega; recorta la descripción; la ficha permite abrir la imagen en grande | resuelto en la app |
| 33  | `telefono` en el registro | Opcional y `nullable: true`                                 | Rechaza `null` ("Expected string, received null")                                     | Si no hay teléfono, omite el campo                                       | resuelto en la app |
| 34  | Códigos al crear una observación | `tipo_ambiente` y `condicion_organismo` en `datos`     | Exige `tipo_ambiente_codigo` y `condicion_organismo_codigo` (400 si faltan)            | Envía los dos nombres                                                    | resuelto en la app |
| 35  | Forma de la observación  | `estado` texto; números; `imagen_url`; `prediccion_original`, `validacion_experta`, `historial_estados` | `estado` objeto; números como texto; `imagen.url_firmada`; `prediccion`, `validacion`, `historial` (estados y actor como objetos); en la predicción, `especie` y `version_modelo` como objeto | `adaptadores.ts` lo pasa a la forma del contrato                         | resuelto en la app |
| 36  | Inferencia asíncrona     | `201` inmediato en `recibido`; la inferencia corre aparte    | El `POST` espera la inferencia (≈30 s) y responde con el estado final                 | El seguimiento se detiene solo; el envío puede tardar (aviso a los 10 s, espera de 90 s) | pendiente          |
| 37  | Foto en el listado       | `imagen_url` en `ObservacionResumen`                         | El listado no trae la foto                                                             | Cada tarjeta visible pide el detalle de su observación para mostrar la foto (`useFotoObservacion`). **Pedido al E3:** incluir la foto en el listado, como dice el contrato | pendiente          |
| 38  | Servicio de visión dormido | —                                                          | Si el servicio de visión no responde, la observación queda `no_concluyente` ("Servicio de visión no disponible") | Se muestra "No se pudo identificar"; un experto puede revisarla. Se duerme con frecuencia: despertarlo antes de pruebas y demo | pendiente          |
| 39  | Estado tras `rechazada`  | No lo define                                                 | `corregido` sin especie (su catálogo: "corrigió o rechazó"); sale de `/observaciones/pendientes` | Resultado y Registros muestran "No se pudo identificar"; no cuenta como identificada; el mock hace lo mismo | resuelto en la app |
| 40  | Nulos en la validación   | `especie_final_codigo` nulo al rechazar; `comentario` opcional y nulo | Rechaza `null` en los dos ("Expected string, received null")                         | Omite los campos nulos                                                   | resuelto en la app |
| 41  | Respuesta de la validación | `200` con `ObservacionDetalle`                             | No trae el detalle completo (sin validación ni historial)                              | Tras el POST vuelve a pedir `GET /observaciones/{id}`                    | resuelto en la app |
| 42  | Forma de la validación   | `decision` texto y `especie_final`                           | `decision` objeto `{codigo, …}` y `especie_corregida`                                  | `adaptadores.ts`                                                         | resuelto en la app |
| 43  | Requisitos de la foto    | JPEG o PNG, lado mayor ≥ 1280 px                             | Acordado con los Equipos 2 y 3 (28 oct): JPG, PNG o WEBP, al menos 32 px por lado y hasta 10 MB. El Equipo 3 está cambiando su validación | La app ya valida los nuevos requisitos. Hay que actualizar el contrato | acordado con E3    |
| 44  | Opcionales nulos al crear una observación | `observaciones_usuario` y `precision_gps_metros` aceptan `null` | Rechaza `null` ("Expected string, received null", "debe ser número"): sin notas o con ubicación escrita a mano, el envío daba 400 | Omite los campos nulos | resuelto en la app |
| 31  | Cuentas de prueba        | Ejemplo `ana.torres@ejemplo.co`                              | Esa cuenta no existe                                                                   | Cuentas propias del Equipo 1; el E3 asignó el rol experto a `e1.experto@ejemplo.co` (28 oct) | resuelto en la app |
| 32  | Respuesta de `/auth/refresh` | `LoginResponse` (nuevo par de tokens y usuario)          | Solo `{access_token, expires_in}`                                                      | Conserva el `refresh_token` anterior y el usuario de la sesión. Límite: la sesión dura como máximo 7 días desde el último inicio de sesión, aunque se use la app a diario | pendiente          |
| 45  | Foto sin raya            | `201` y la observación pasa a `no_concluyente` o `pendiente_experto` | Desde el 28 oct (noche) responde 500 (`ERROR_INTERNO`), pero **crea la observación**, que se queda en `recibido`. El 27 y 28 oct la misma foto quedaba `no_concluyente`. Ver `pruebas/pruebas-funcionales-2026-10-28.md`, caso A12 | Muestra "Algo falló de nuestro lado". Cada nuevo intento crea otra observación, y la cola de envío reintenta tras un 500 (hasta 3 copias). Posible ajuste: tratar el 500 del envío como un tiempo agotado y revisar si ya existe antes de reenviar | pendiente (E3)     |

## Preguntas para el Equipo 3

Respondidas:

- **Códigos de los catálogos:** los de la fila 28.
- **Estado tras `rechazada`:** se acordó `no_concluyente`, pero el backend la deja en `corregido` sin especie y la saca de "Por validar" (fila 39). La app sigue al backend; **confirmar con el Equipo 3 que es lo que quieren**.
- **Formato de error:** se queda como está; la app lo toma tal cual (fila 23).
- **Cuenta experto:** el Equipo 1 la registra y el Equipo 3 le asigna el rol.
- **Modelo:** el modelo del Equipo 2 ya está integrado con la API.
- El alcance es solo rayas: la variable `grupo` no se usa en la interfaz.

Abiertas:

- **Urgente (antes de la demo):** con una foto sin raya, `POST /observaciones` responde 500 pero crea la observación, que se queda en `recibido` (fila 45). Debería quedar `no_concluyente`, como antes.
- **Pedido:** que `/auth/refresh` devuelva también un `refresh_token` nuevo en cada renovación, como ya promete el contrato con `LoginResponse` (fila 32). Así la sesión se mantiene abierta mientras se use la app, en vez de vencer a los 7 días del último inicio de sesión.

- ¿`info.version: "3"` es la versión vigente? La descripción dice "v1.0".
- ¿Habrá forma de editar una validación experta ya enviada? Solo existe `POST /observaciones/{id}/validacion` (409 si ya existe).
- `POST /observaciones` no tiene idempotencia: si un envío se corta, reenviarlo puede duplicar la observación.
- ¿Se podrán registrar observaciones sin cuenta? Sería útil para pescadores que no manejan cuentas.

Todo esto también hay que verlo con el equipo de Visión Artificial: hay que encontrar un equilibrio entre lo que le sirve al usuario y lo que le sirve al modelo para dar buenas clasificaciones.
