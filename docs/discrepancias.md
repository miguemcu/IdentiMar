# Discrepancias mockup ↔ contrato de integración

Comparación entre el mockup de Figma (`docs/mockup/`) y el contrato OpenAPI del Equipo 3 (`docs/contrato_integracion.yaml`).

- Revisado el 2026-10-07 sobre los modelos de datos y el formulario de nueva observación. **No** se recorrió el mockup pantalla por pantalla.
- El contrato dice "v1.0" en su descripción, pero `info.version` figura como `'3'`. Confirmar con el Equipo 3 cuál es la versión vigente.
- Columna **Estado**: `pendiente` · `acordado con E3` · `resuelto en la app`.

## 1. Formulario de nueva observación

| #   | Tema                    | Mockup                           | Contrato                                                             | Acción en la app                                                                | Estado    |
| --- | ----------------------- | -------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------- |
| 1   | Ubicación               | Texto libre ("Turbo, Antioquia") | `latitud` y `longitud` obligatorias, `precision_gps_metros` opcional | Capturar con GPS (`expo-location`); permitir ajuste manual                      | pendiente |
| 2   | Fecha y hora            | "Mañana / Tarde / Noche"         | `fecha_hora_evento` en ISO 8601, obligatoria                         | Tomar la hora del dispositivo y permitir editarla                               | pendiente |
| 3   | Condición del organismo | No existe                        | `condicion_organismo` obligatoria (catálogo)                         | Agregar el campo al formulario                                                  | pendiente |
| 4   | Tipo de ambiente        | Mar / Estuario / Manglar         | `tipo_ambiente` con códigos de `/catalogos/tipos-ambiente`           | Cargar opciones del catálogo (hoy solo se conoce el código de ejemplo `marino`) | pendiente |
| 5   | Profundidad             | Campo propio (opcional)          | No existe                                                            | Preguntar al E3 si la necesitan; si no, anexarla a las notas                    | pendiente |
| 6   | Notas                   | "Notas adicionales"              | `observaciones_usuario`, máx. 2000 caracteres                        | Limitar a 2000 caracteres                                                       | pendiente |
| 7   | Imagen                  | Foto de cámara o galería         | JPEG o PNG, lado mayor ≥ 1280 px; error 413 si es muy grande         | Validar tamaño y dimensiones antes de enviar                                    | pendiente |

## 2. Resultado, estados y confianza

| #   | Tema                    | Mockup                                  | Contrato                                                                                                 | Acción en la app                                                    | Estado    |
| --- | ----------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------- |
| 8   | Flujo de identificación | Pantalla "Procesando" y luego resultado | Respuesta `201` inmediata; la inferencia corre en segundo plano                                          | Mostrar estados intermedios y consultar después (detalle o listado) | pendiente |
| 9   | Estados                 | Etiquetas sueltas ("Validado", etc.)    | `recibido`, `procesando`, `identificado`, `no_concluyente`, `pendiente_experto`, `validado`, `corregido` | Mapear cada estado a un texto y color en español                    | pendiente |
| 10  | Confianza               | Porcentaje entero                       | Número entre 0 y 1                                                                                       | Convertir al mostrar                                                | pendiente |
| 11  | Caso sin resultado      | No contemplado                          | `no_concluyente` y `especie_aceptada` nula                                                               | Diseñar la pantalla para "no se pudo identificar"                   | pendiente |

## 3. Validación experta

| #   | Tema                    | Mockup                                              | Contrato                                                                                  | Acción en la app                                                | Estado    |
| --- | ----------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------- |
| 12  | Decisión del experto    | "Porcentaje de validación"                          | `decision` (`confirmada`, `corregida`, `rechazada`), `especie_final_codigo`, `comentario` | Rediseñar esa parte; el porcentaje no existe en el contrato     | pendiente |
| 13  | Cola de pendientes      | "Como experto puedes validar cualquier observación" | Cola dedicada (`/observaciones/pendientes`, solo experto o administrador)                 | Definir cómo llega el experto a la cola                         | pendiente |
| 14  | Conservar la predicción | No contemplado                                      | La predicción original del modelo no se sobrescribe                                       | Mostrar predicción original y decisión del experto por separado | pendiente |
| 15  | Rechazo                 | No contemplado                                      | `rechazada` con `especie_final_codigo` nulo                                               | Agregar la opción "No se puede identificar"                     | pendiente |

## 4. Registros, usuarios y certificación

| #   | Tema                       | Mockup                                                       | Contrato                                                       | Acción en la app                                                      | Estado    |
| --- | -------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------- | --------- |
| 16  | Pestaña "Todos"            | Lista observaciones de todos los usuarios                    | Un usuario común solo ve las suyas (el administrador ve todas) | Preguntar al E3 si habrá un listado público; si no, quitar la pestaña | pendiente |
| 17  | Certificación como experto | Flujo de 4 pantallas (área, años, motivación, revisión)      | **Sin endpoint** de solicitud                                  | Acordar con el E3: endpoint nuevo, campos y quién aprueba             | pendiente |
| 18  | Roles                      | Usuario y experto                                            | `usuario`, `experto`, `administrador`                          | Alinear nombres; decidir si la app contempla administrador            | pendiente |
| 19  | Autenticación              | Sin pantallas de registro ni inicio de sesión en lo revisado | Registro, login, refresh y perfil                              | Diseñar esas pantallas (no están en el mockup)                        | pendiente |

## 5. Especies

| #   | Tema               | Mockup                                                                   | Contrato                                                                                                  | Acción en la app                                                          | Estado    |
| --- | ------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------- |
| 20  | Campos de la ficha | `habitat`, `depth`, `size`, estado de conservación, `regionCount`, color | `codigo`, `nombre_cientifico`, `nombre_comun`, `familia`, `grupo`, `descripcion`, `url_imagen_referencia` | Quitar los extras del mockup o pedirlos al E3                             | pendiente |
| 21  | Identificadores    | Numéricos                                                                | UUID, más `codigo` taxonómico (ej. `URO_MICR`)                                                            | Usar `id` UUID y `codigo`                                                 | pendiente |
| 22  | Grupo              | Solo rayas                                                               | `grupo`: `raya` o `tiburon`                                                                               | Preguntar si la app mostrará tiburones; el README habla solo de batoideos | pendiente |

## Prioridades

1. **Ubicación, hora y condición del organismo** (#1, #2, #3): cambian el formulario y bloquean el envío de observaciones.
2. **Certificación** (#17): requiere acuerdo con el Equipo 3 antes de construir esas pantallas.
3. **Flujo asíncrono y estados** (#8, #9): afectan la navegación posterior al envío.
4. **Validación experta** (#12, #13): rediseño de pantallas de experto.

## Preguntas para el Equipo 3

- ¿Qué códigos tiene cada catálogo (`tipos-ambiente`, `condiciones-organismo`, `estados`)?
- ¿Habrá endpoint para la solicitud de certificación como experto? ¿Quién la aprueba?
- ¿Habrá un listado de observaciones de otros usuarios para la pestaña "Todos"?
- ¿Se guarda la profundidad? ¿En qué campo?
- ¿La app debe mostrar tiburones además de rayas?
- ¿Cuál es la versión vigente del contrato?
