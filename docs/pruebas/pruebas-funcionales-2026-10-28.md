# Pruebas funcionales: 28 oct 2026

Registro de las pruebas funcionales del MVP, según la sección "Pruebas funcionales" de [`Dod.md`](../Dod.md). Las pruebas se hicieron de tres formas:

- **Revisiones automáticas** del proyecto (tipos, lint, dependencias y compilación).
- **Casos desde el computador:** dos scripts ejecutan los servicios de la app (los mismos que usan las pantallas). Uno usa los datos simulados y el otro el backend desplegado (`https://identimar-backend.onrender.com/api/v1`) con las cuentas del Equipo 1.
- **Casos en el teléfono:** recorridos a mano en Android (Expo Go y la APK).

Resultados posibles: **aprobado**, **fallido** o **bloqueado** (no se pudo ejecutar).

## Resumen

| Tipo                          | Aprobados | Fallidos | Bloqueados |
| ----------------------------- | --------- | -------- | ---------- |
| Revisiones automáticas        | 5         | 0        | 0          |
| Datos simulados (computador)  | 20        | 0        | 0          |
| API real (computador)         | 16        | 1        | 2          |
| Teléfono                      | 18        | 0        | 0          |

**Hallazgo principal:** con una foto sin raya, el backend responde 500 y aun así crea la observación, que queda en `recibido` (caso A12). Está en [`discrepancias.md`](../discrepancias.md), fila 45.

---

## 1. Revisiones automáticas

Ejecutadas el 28 oct sobre la rama `docs/actualizar-documentacion`.

| Comando                                    | Resultado                          |
| ------------------------------------------ | ---------------------------------- |
| `npx tsc --noEmit`                         | Aprobado: sin errores              |
| `npx expo lint`                            | Aprobado: sin errores              |
| `npx expo-doctor`                          | Aprobado: 20/20                    |
| `npx expo export --platform android`       | Aprobado: el bundle compila        |
| `npx tsx scripts/probar-servicios.ts`      | Aprobado: flujo completo simulado  |

---

## 2. Casos con datos simulados (desde el computador)

```bash
npx tsx --import ./scripts/node/preparar.mjs scripts/probar-casos-mock.ts
```

`scripts/node/` reemplaza los módulos del teléfono (`expo-file-system`, `expo-secure-store`) para que los servicios corran en Node. Cada caso fuerza el error con `EXPO_PUBLIC_MOCK_ERROR` o el resultado con `EXPO_PUBLIC_MOCK_RESULTADO`, como en la app.

| Caso | Qué se prueba                                         | Resultado | Detalle                                                                  |
| ---- | ----------------------------------------------------- | --------- | ------------------------------------------------------------------------ |
| F01  | Iniciar sesión con cada rol                           | Aprobado  | `usuario`, `experto` y `administrador`                                   |
| F02  | Registro con correo ya usado (409)                    | Aprobado  | "Ya hay una cuenta con ese correo. Intenta entrar con él."               |
| F03  | Observación válida: se crea y aparece en Registros    | Aprobado  | Creada en `recibido` y listada                                            |
| F04  | Latitud fuera de rango                                | Aprobado  | El formulario marca "Debe estar entre -90 y 90"; el servicio responde 400 |
| F05  | Foto: tamaño, formato y peso                          | Aprobado  | Se rechazan 31 px, GIF y 11 MB; se aceptan 32 px y un PNG sin tipo (se deduce por la extensión) |
| F06  | Envío con error 400                                   | Aprobado  | "Revisa estos datos: Latitud: revisa el número que escribiste."           |
| F06  | Envío con error 401                                   | Aprobado  | "Tu sesión expiró. Vuelve a iniciar sesión."                              |
| F06  | Envío con error 413                                   | Aprobado  | "La foto pesa demasiado. Toma otra o elige una más liviana."              |
| F06  | Envío con error 500                                   | Aprobado  | "Algo falló de nuestro lado. Inténtalo más tarde."                        |
| F06  | Envío sin conexión                                    | Aprobado  | "No tienes internet en este momento…"                                     |
| F07  | Resultado `identificado`                              | Aprobado  | `recibido` → `procesando` → `identificado`                                |
| F07  | Resultado `pendiente_experto`                         | Aprobado  | `recibido` → `procesando` → `pendiente_experto`                           |
| F07  | Resultado `no_concluyente`                            | Aprobado  | `recibido` → `procesando` → `no_concluyente`                              |
| F08  | Observador no puede ver "Por validar"                 | Aprobado  | 403                                                                      |
| F09  | Las pendientes aparecen en "Por validar"              | Aprobado  |                                                                          |
| F10  | Experto confirma                                      | Aprobado  | Queda `validado` con la especie propuesta y sale de la cola               |
| F10  | Experto corrige                                       | Aprobado  | Queda `corregido` con la especie elegida y sale de la cola                |
| F10  | Experto rechaza                                       | Aprobado  | Queda `corregido` sin especie (como el backend) y sale de la cola         |
| F11  | Validación sin permiso (403)                          | Aprobado  | "No tienes permiso para validar observaciones."                           |
| F11  | Validación ya hecha (409)                             | Aprobado  | "Esta observación ya no se puede validar: puede que otro experto ya la haya revisado." |

**20 de 20 aprobados.**

---

## 3. Casos con la API real (desde el computador)

```bash
E1_USUARIO_CLAVE=... E1_EXPERTO_CLAVE=... FOTO_RAYA=ruta/raya.jpg FOTO_NO_RAYA=ruta/otra.jpg \
npx tsx --import ./scripts/node/preparar.mjs scripts/probar-casos-api.ts
```

Las contraseñas no están en el repo; pedirlas a quien creó las cuentas. El script crea observaciones de prueba en `e1.usuario@ejemplo.co` (con la nota "Prueba automática del Equipo 1") y solo valida esas, nunca las de otras cuentas. Se usa la foto de una raya de 1280 × 960 px y otra sin raya. La foto de 11 MB y el GIF los genera el script.

| Caso | Qué se prueba                                         | Resultado  | Detalle                                                                 |
| ---- | ----------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| A01  | Contraseña equivocada                                 | Aprobado   | 401: "El correo o la contraseña no coinciden."                           |
| A02  | Registro con correo ya usado                          | Aprobado   | 409: "Ya hay una cuenta con ese correo. Intenta entrar con él."          |
| A03  | Iniciar sesión como usuario y ver el perfil           | Aprobado   | Rol `usuario`; token por 3600 s                                          |
| A04  | Renovar el token                                      | Aprobado   | Token nuevo por 3600 s. No llega un `refresh_token` nuevo (fila 32)     |
| A05  | Catálogos                                             | Aprobado   | 4 especies, 7 familias, 6 ambientes, 5 condiciones                       |
| A06  | Observación válida: resultado, Registros y detalle    | Aprobado   | `identificado`, *Hypanus guttatus*, 94 % de confianza, con foto en el detalle (≈5 s) |
| A07  | Latitud fuera de rango (sin el bloqueo del formulario) | Aprobado  | 400: "Revisa estos datos: Latitud: revisa el número que escribiste."     |
| A08  | Foto de más de 10 MB                                  | Aprobado   | 413: "La foto pesa demasiado. Toma otra o elige una más liviana."        |
| A09  | Foto GIF (sin el bloqueo del formulario)              | Aprobado   | 400: "Algunos datos no son válidos…". En la app el formulario la rechaza antes |
| A10  | Observador no puede ver "Por validar"                 | Aprobado   | 403                                                                     |
| A11  | Observador no puede validar                           | Aprobado   | 403: "No tienes permiso para validar observaciones."                     |
| A12  | Foto sin raya: queda para el experto                  | **Fallido** | El backend responde 500 (`ERROR_INTERNO`), pero la observación **sí se crea** y queda en `recibido`. Se repitió con tres fotos distintas sin raya. El 27 y 28 oct la misma foto quedaba `no_concluyente` |
| A13  | Sin sesión: crear observación                         | Aprobado   | 401: "Tu sesión expiró. Vuelve a iniciar sesión."                        |
| A14  | Iniciar sesión como experto y ver "Por validar"       | Aprobado   | Rol `experto`                                                           |
| A15  | Experto corrige                                       | Aprobado   | Queda `corregido` con *Hypanus guttatus* y sale de la cola               |
| A15  | Experto rechaza                                       | Bloqueado  | Por A12 no quedó otra observación de prueba en la cola. Ya se había probado el 28 oct (queda `corregido` sin especie) |
| A15  | Experto confirma una predicción                       | Bloqueado  | Hace falta una `pendiente_experto` con predicción, y el modelo no dejó ninguna |
| A16  | Validar una observación ya validada                   | Aprobado   | 409: "Esta observación ya no se puede validar…"                          |
| A17  | Validar una observación que no existe                 | Aprobado   | 404: "No encontramos esta observación. Puede que ya no exista."          |

**16 de 19 aprobados, 1 fallido y 2 bloqueados.**

**Qué pasa en la app por A12:** al enviar una foto sin raya con conexión, la persona ve "Algo falló de nuestro lado. Inténtalo más tarde." y en Registros aparece una observación en "Recibido" que no avanza. Si lo intenta de nuevo, se crea otra. Desde la cola de envío (sin señal al registrar), tras un 500 se reintenta a los 15 y 30 s, así que pueden quedar hasta 3 copias. Le corresponde al Equipo 3: debería dejarla `no_concluyente`, como antes. Mientras tanto, la app podría tratar el 500 del envío como el tiempo agotado: revisar si la observación ya existe antes de reenviarla.

Por las corridas de hoy quedaron 5 observaciones de prueba en `recibido` en la cuenta `e1.usuario`. El contrato no permite borrarlas.

---

## 4. Casos en el teléfono (Android)

Los recorrió el Equipo 1 entre el 25 y el 28 oct en Expo Go y en la APK, con datos simulados y con la API real. El detalle de cada uno está en [`Dod.md`](../Dod.md) y en [`estado_actual.md`](../estado_actual.md).

| Caso                                                                                   | Dónde                  | Resultado |
| -------------------------------------------------------------------------------------- | ---------------------- | --------- |
| Registro, inicio y cierre de sesión (usuario y experto)                                | Expo Go, API real      | Aprobado  |
| La sesión sigue abierta al cerrar y reabrir la app                                     | Expo Go, API real      | Aprobado  |
| Observación completa: foto, ubicación, datos, resultado del modelo, Registros y detalle | Expo Go, API real      | Aprobado  |
| Foto que no cumple (formato o tamaño): mensaje claro para tomar otra                   | Expo Go, simulado      | Aprobado  |
| Errores 400 y 413 al enviar, con mensaje en español                                    | Expo Go, simulado      | Aprobado  |
| 401 al enviar: vuelve a inicio de sesión sin perder el borrador                        | Expo Go, simulado      | Aprobado  |
| Resultado `no_concluyente`: mensaje y opción de tomar otra foto                        | Expo Go, API real      | Aprobado  |
| Filtro por estado en Registros y foto en el detalle (con reintento si vence)            | Expo Go                | Aprobado  |
| Catálogo de especies, buscador y ficha                                                 | Expo Go, API real      | Aprobado  |
| "Por validar": la no concluyente aparece y el experto la corrige                       | Expo Go, API real      | Aprobado  |
| Observador: no ve "Por validar" ni los controles del experto                           | Expo Go                | Aprobado  |
| Detalle del usuario con la decisión del experto, sin reiniciar la app                  | Expo Go, API real      | Aprobado  |
| Errores 403 y 409 de la validación                                                     | Expo Go, simulado      | Aprobado  |
| Borrador: se recupera al reabrir la app                                                | Expo Go                | Aprobado  |
| **Sin conexión:** tras entrar una vez con conexión, la app abre sin señal, muestra lo guardado con la franja "Sin conexión", deja la observación "Pendiente de envío" y la envía al volver la señal | Teléfono | Aprobado |
| Visor de foto: pellizcar, arrastrar, doble toque y compartir                           | Expo Go                | Aprobado  |
| **Guardar la foto en el teléfono**                                                     | APK                    | Aprobado  |
| La APK se instala y abre                                                               | APK                    | Aprobado  |

**Requisito del modo sin conexión:** hay que haber entrado al menos una vez con conexión. La sesión y los catálogos se guardan en ese primer ingreso; sin eso, la app no puede abrir ni enviar.

### Sin probar en el teléfono

- **iOS:** no se probó en ningún iPhone.
- **Renovación del token a la hora**, en el teléfono. Desde el computador funciona (A04).
- **Token vencido sin red:** que la cola se mantenga y se envíe al renovar la sesión.
- **Cola tras un 500**, con `EXPO_PUBLIC_MOCK_ERROR=500` (reintentos a los 15 y 30 s). Probado en Node.
