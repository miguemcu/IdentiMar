# Estado actual de la app (25 oct 2026)

Resumen de cómo está IdentiMar hoy en la rama `develop`, que ya incluye la identidad visual (`style/refactor-identidad-visual`, #15). El avance contra el DoD está marcado en [`Dod.md`](Dod.md); las diferencias con el contrato, en [`discrepancias.md`](discrepancias.md).

- **Datos:** todo funciona con datos simulados (mock). No hay llamadas de red todavía. Con `EXPO_PUBLIC_USE_API=true` todos los servicios usan los esqueletos API, así que no se puede entrar a la app hasta H2.
- **Verificado en:** Expo Go en Android. Falta probar en iOS.
- **Calidad:** `npx tsc --noEmit` y `npx expo lint` sin errores; `scripts/probar-servicios.ts` pasa; el bundle de Android (`expo export`) compila.

---

## Lo que puede hacer un usuario hoy

1. **Entrar o crear cuenta.** Con datos simulados, cualquier correo y contraseña válidos entran. Hay cuentas de prueba para cada rol. Al crear cuenta, el Perfil muestra el nombre registrado. Si el correo ya está registrado o un dato no es válido, el mensaje aparece en español junto al campo.
2. **Inicio.** Saludo, cifras de sus registros (Registros, Identificadas, En revisión), sus últimos registros, una nota para cuando no hay internet en el mar y una raya del catálogo que cambia cada día.
3. **Registrar una raya en 3 pasos.**
   - **Foto:** cámara o galería. Se valida que sea JPEG o PNG con lado mayor de al menos 1280 px.
   - **Dónde y cuándo:** ubicación por GPS (o a mano si no hay permiso) y fecha y hora del teléfono, editables y sin fechas futuras.
   - **Sobre el animal:** tipo de ambiente, estado del animal y notas (máximo 2000 caracteres).
4. **Ver el resultado.** La pantalla sigue el estado real de la observación hasta que termina:
   - **Identificado:** especie y qué tan segura está la app, como sugerencia.
   - **En revisión por un experto:** sin porcentaje.
   - **No se pudo identificar:** con opción de tomar otra foto.
5. **Consultar sus registros**, filtrar por estado y abrir el detalle: foto, datos, sugerencia de la app, validación del experto (si la hay) e historial. Si la foto no carga, el detalle se vuelve a pedir una vez y, si sigue fallando, se ofrece reintentar.
6. **Consultar el catálogo de especies** (solo rayas) con buscador y ficha con código y familia.
7. **Perfil:** datos (desde `GET /auth/perfil`; si falla, los de la sesión), rol, cifras, nota para certificarse como experto y cerrar sesión.

Si la sesión vence (401) al seguir el resultado, en el detalle, en el perfil o en la cola, la app vuelve a inicio de sesión con el aviso "Tu sesión venció, vuelve a entrar."

**Experto o administrador:** desde Perfil abre la cola "Por validar". En el detalle de una observación pendiente o no concluyente puede confirmar la especie, corregirla eligiendo otra del catálogo o marcarla como "No se puede identificar", con un comentario opcional (máximo 2000 caracteres). El comentario no se puede editar después de enviado. Los controles ya no dependen del modo simulado; con `EXPO_PUBLIC_USE_API=true` no se puede entrar a la app hasta H2.

---

## Cómo probarlo

```bash
npm install
cp .env.example .env
npx expo start -c
```

| Variable                     | Valores                                                         | Para qué                                               |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| `EXPO_PUBLIC_USE_API`        | `false` (por defecto) · `true`                                  | `true` usa el esqueleto de la API, que aún lanza error |
| `EXPO_PUBLIC_MOCK_ERROR`     | vacío · ver la lista de abajo                                   | Fuerza un error en el mock                             |
| `EXPO_PUBLIC_MOCK_RESULTADO` | vacío · `identificado` · `pendiente_experto` · `no_concluyente` | Fuerza el resultado de la identificación               |

Valores de `EXPO_PUBLIC_MOCK_ERROR` (uno a la vez; reiniciar con `-c` al cambiarlo):

- **Enviar observación:** `400` · `401` · `413` · `red`
- **Registro:** `409` · `400-auth` (el correo `ya.registrado@ejemplo.co` siempre da 409)
- **Seguimiento y detalle:** `401-seguimiento` (la segunda consulta del detalle da 401) · `imagen-vencida` (la primera consulta de cada registro trae una foto que no carga) · `imagen-vencida-siempre`
- **Ficha de especie:** `familias`
- **Perfil:** `perfil` · `401-perfil`
- **Cola "Por validar":** `pendientes` · `403-pendientes`
- **Validación experta:** `403-validacion` · `409-validacion`

Con `EXPO_PUBLIC_MOCK_RESULTADO=pendiente_experto`, se envía una observación, se cambia a **Experto** en Perfil y se valida desde el detalle. Los datos simulados viven en memoria: al recargar la app se pierden las observaciones nuevas.

---

## Cómo está organizado el código

| Carpeta              | Contenido                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`           | Rutas (Expo Router): `(auth)`, `(tabs)`, `nueva-observacion`, `observaciones/[id]`, `observaciones/resultado/[id]`, `especies/[id]`, `validacion/pendientes` |
| `src/components/ui/` | Componentes de la identidad visual: `HeroHeader`, `ActionCard`, `StatTile`, `Chip`, `Icono`, `Avatar`, `Card`, `Button`, `EstadoBadge`… |
| `src/services/`      | Interfaces por dominio, implementación `mock/` y esqueleto `api/`. Las pantallas solo usan esta capa                                    |
| `src/hooks/`         | `useSeguimientoObservacion` (consulta el estado con esperas crecientes) y `useResumenRegistros`                                         |
| `src/types/`         | Tipos con la forma del contrato (snake_case, UUID, estados del contrato)                                                                |
| `src/constants/`     | Formato de fechas (hora local, 12 horas) y búsqueda de especies                                                                         |

**Identidad visual:** sistema Bentos Costero. Las franjas superiores usan `ocean-dark` porque el texto blanco sobre `ocean` no alcanza el contraste mínimo (4.1:1 frente a 4.5:1). Las tarjetas con color usan fondos opacos para que la sombra de Android no se vea a través. Los íconos usan SF Symbols en iOS y Material Symbols en Android, coloreados con clases de NativeWind.

**Dependencias agregadas:** `@react-native-community/datetimepicker` (fecha y hora).

---

## Pendiente

**H0**

- ~~Esqueleto `api` para autenticación y catálogos (hoy solo existe el de observaciones).~~ Hecho en `feature/cierre-h0`: esqueletos de auth, catálogos y validación, y `EXPO_PUBLIC_USE_API` cambia todos los dominios a la vez. **Verificado en Expo Go (Android)** con `EXPO_PUBLIC_USE_API=true` y `npx expo start -c`, al iniciar sesión aparece "No pudimos conectarnos en este momento. Inténtalo más tarde." y la app no se cierra. Solo se recorrió en Expo Go el inicio de sesión; el resto de los esqueletos está en código pero no se reviso en Expo Go.
- ~~Mensajes propios para 400 y 409 en inicio de sesión y registro.~~ Hecho en `feature/cierre-h0`. El contrato solo define 401 para el inicio de sesión; 400 y 409 aplican al registro. **Verificado en Expo Go (Android)** registrarse con `ya.registrado@ejemplo.co` o con `EXPO_PUBLIC_MOCK_ERROR=409` muestra "Ya hay una cuenta con ese correo" y marca el campo correo; con `EXPO_PUBLIC_MOCK_ERROR=400-auth` el error aparece bajo el campo correo; datos inválidos muestran un mensaje por campo. El 401 del inicio de sesión no se puede forzar con el mock: queda para H2.
- ~~Guardar el `refresh_token` en la sesión.~~ Hecho en `feature/cierre-h0`: la sesión guarda `access_token`, `refresh_token` y `expires_in` en memoria (secure-store llega en H2); al registrarse se inicia sesión con los mismos datos. **Está en el codigo** la sesión guarda los tres valores y `logout` los borra. **En Expo Go (Android)** un registro válido entra a Inicio y el Perfil muestra el nombre registrado; el inicio de sesión entra a Inicio; cerrar sesión vuelve a la pantalla de inicio de sesión.

**H0: Por revisar** (implementado en `feature/cierre-h0`, sin marcar como hecho)

- Esqueletos `api` de observaciones, validación y catálogos: solo comprobados en el código (compilan con `npx tsc --noEmit`), no en Expo Go. Verificar cuando haya sesión con la API real: cada pantalla que los use muestra un error claro y no se cierra.
- Tokens en memoria (`refresh_token`, `expires_in`): no se ven en pantalla. En Expo Go solo se verificó que registro, inicio y cierre de sesión funcionan. Verificar en H2 que la renovación con `/auth/refresh` usa el `refresh_token` guardado.
- 401 del inicio de sesión: tiene mensaje ("El correo o la contraseña no coinciden."), pero el mock no lo puede forzar. Verificar con la API real en H2.
- 400 del inicio de sesión: el contrato no lo define (solo 401). Confirmar con el Equipo 3 si existe; si no, no se maneja.

**H1 (Frentes A, B y validación)**, implementado en `feature/h1-pendientes`

- ~~Volver a consultar el detalle si la URL firmada de la imagen venció.~~ **Verificado en Expo Go (Android):** con `imagen-vencida` la foto aparece tras reconsultar; con `imagen-vencida-siempre` aparece "No pudimos cargar la foto" y el botón para reintentar repite el ciclo sin cerrar la app.
- ~~Ficha de especie con `código` y familia desde `/catalogos/familias`.~~ **Verificado en Expo Go (Android):** la tarjeta "Clasificación" muestra código, familia y su descripción; con `familias` la ficha no se rompe.
- ~~Perfil con `GET /auth/perfil`.~~ **Verificado en Expo Go (Android):** los datos cambian con la cuenta y el rol de prueba; con `perfil` se ve la nota "No pudimos actualizar tus datos"; con `401-perfil` vuelve a inicio de sesión con aviso.
- ~~Cola "Por validar" (`GET /observaciones/pendientes`): con la API real es la única forma de que el experto vea observaciones de otros usuarios.~~ **Verificado en Expo Go (Android):** botón en Perfil solo para experto y administrador; las observaciones validadas salen de la cola; estados vacío, error y sin permiso.
- ~~Comentario editable del experto y mensajes para 403 y 409.~~ **Verificado en Expo Go (Android):** comentario con contador y límite de 2000, visible en la validación y el historial; mensajes de 403 y 409 con `403-validacion` y `409-validacion`.
- ~~Un 401 durante el seguimiento del resultado solo muestra el mensaje; no lleva a inicio de sesión.~~ **Verificado en Expo Go (Android):** con `401-seguimiento`, Resultado y el detalle vuelven a inicio de sesión con el aviso "Tu sesión venció, vuelve a entrar."; el aviso desaparece al entrar de nuevo.

**H1: Por revisar** (sin marcar como hecho)

- Cola "Por validar": que un observador que llegue por la ruta directa vea "Esta sección es para expertos". Desde la interfaz no se puede llegar.
- Validación: el 409 real (los controles se ocultan antes de poder validar dos veces), la tarjeta roja que aparece cuando el 409 recarga una observación ya validada, el 404 y el 400. No hay valor para forzarlos.
- Controles del experto, perfil y ficha con `EXPO_PUBLIC_USE_API=true`: no se puede entrar a la app hasta H2.
- Ficha y perfil: en el mock la familia y el perfil traen el mismo dato por las dos vías; solo se verificó que los flujos no se rompen.

**Offline (parte 1)**

- Borrador local, copia local de la foto, cola `pendiente_envio` y caché de catálogos. Mientras tanto, la app sugiere tomar la foto con la cámara del teléfono y subirla desde la galería al tener internet.

**H2:** integración real con la API (autenticación, observaciones, catálogos, validación y sincronización).

**Pruebas:** las pruebas funcionales y de usabilidad del DoD aún no se han registrado en `docs/pruebas/`.

---

## Preguntas abiertas para el Equipo 3

- A qué estado pasa una observación cuando el experto la rechaza (`rechazada`). El mock la deja en `no_concluyente` y la saca de la cola "Por validar"; confirmar que el backend también la saca.
- No hay endpoint para editar o borrar una validación (solo `POST`, que responde 409 si ya existe). Si el experto necesita corregir su comentario o su decisión, hay que definirlo.
- Los catálogos de ambiente y condición usan los códigos del DoD; el contrato no los enumera.
- La respuesta del modelo trae `umbral_minimo` y `tiempo_inferencia_ms`, que no están en el contrato, y la especie como nombre científico (`Hypanus_guttatus`) en vez de `codigo`.
- Habrá forma de editar una validación experta ya enviada? El contrato solo tiene `POST /observaciones/{id}/validacion` (409 si ya existe), así que el comentario y la decisión no se pueden corregir.
