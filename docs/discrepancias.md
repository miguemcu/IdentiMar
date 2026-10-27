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
| 7   | Imagen                  | Foto de cámara o galería         | JPEG o PNG, lado mayor ≥ 1280 px; error 413 si es muy grande         | Validación de formato y tamaño antes de enviar; mensaje para el 413         | resuelto en la app |

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
| 15  | Rechazo                 | No contemplado                                      | `rechazada` con `especie_final_codigo` nulo; el contrato no dice a qué estado pasa        | Opción "No se puede identificar". Acordado: pasa a `no_concluyente` | acordado con E3    |

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
| 29  | Códigos de especie       | Ejemplo `URO_MICR`                                           | Mezclados: `DASYA_AME`, `URO_MICR` y, para las clases del modelo, `Hypanus_guttatus`    | Usa el `codigo` que llegue; mock con los mismos códigos                  | pendiente          |
| 30  | Textos de los catálogos  | —                                                            | Sin tildes (`Dulceacuicola`, `Raya latigo`); sin `url_imagen_referencia`               | Muestra lo que llega; sin foto, la ficha la omite y la lista muestra un ícono | pendiente          |
| 33  | `telefono` en el registro | Opcional y `nullable: true`                                 | Rechaza `null` ("Expected string, received null")                                     | Si no hay teléfono, omite el campo                                       | resuelto en la app |
| 31  | Cuentas de prueba        | Ejemplo `ana.torres@ejemplo.co`                              | Esa cuenta no existe                                                                   | Cuentas propias del Equipo 1; el E3 asigna el rol experto                | acordado con E3    |
| 32  | Respuesta de `/auth/refresh` | `LoginResponse` (nuevo par de tokens y usuario)          | Solo `{access_token, expires_in}`                                                      | Conserva el `refresh_token` anterior y el usuario de la sesión. Límite: la sesión dura como máximo 7 días desde el último inicio de sesión, aunque se use la app a diario | pendiente          |

## Preguntas para el Equipo 3

Respondidas:

- **Códigos de los catálogos:** los de la fila 28.
- **Estado tras `rechazada`:** `no_concluyente` (fila 15).
- **Formato de error:** se queda como está; la app lo toma tal cual (fila 23).
- **Cuenta experto:** el Equipo 1 la registra y el Equipo 3 le asigna el rol.
- **Modelo:** el modelo del Equipo 2 ya está integrado con la API.
- El alcance es solo rayas: la variable `grupo` no se usa en la interfaz.

Abiertas:

- **Pedido:** que `/auth/refresh` devuelva también un `refresh_token` nuevo en cada renovación, como ya promete el contrato con `LoginResponse` (fila 32). Así la sesión se mantiene abierta mientras se use la app, en vez de vencer a los 7 días del último inicio de sesión.

- ¿`info.version: "3"` es la versión vigente? La descripción dice "v1.0".
- ¿Habrá forma de editar una validación experta ya enviada? Solo existe `POST /observaciones/{id}/validacion` (409 si ya existe).
- `POST /observaciones` no tiene idempotencia: si un envío se corta, reenviarlo puede duplicar la observación.
- ¿Una observación rechazada (`no_concluyente` con validación) sale de `/observaciones/pendientes`?
- ¿Se podrán registrar observaciones sin cuenta? Sería útil para pescadores que no manejan cuentas.

Todo esto también hay que verlo con el equipo de Visión Artificial: hay que encontrar un equilibrio entre lo que le sirve al usuario y lo que le sirve al modelo para dar buenas clasificaciones.
