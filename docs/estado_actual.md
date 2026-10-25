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
5. **Consultar sus registros**, filtrar por estado y abrir el detalle: foto, datos, sugerencia de la app, validación del experto (si la hay) e historial.
6. **Consultar el catálogo de especies** (solo rayas) con buscador y ficha.
7. **Perfil:** datos, rol, cifras, nota para certificarse como experto y cerrar sesión.

**Experto o administrador:** desde el detalle de una observación pendiente o no concluyente puede confirmar la especie, corregirla eligiendo otra del catálogo o marcarla como "No se puede identificar". Por ahora solo aparece con datos simulados.

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
| `EXPO_PUBLIC_MOCK_ERROR`     | vacío · `400` · `401` · `413` · `red`                           | Fuerza un error al enviar una observación              |
| `EXPO_PUBLIC_MOCK_RESULTADO` | vacío · `identificado` · `pendiente_experto` · `no_concluyente` | Fuerza el resultado de la identificación               |

Con `EXPO_PUBLIC_MOCK_RESULTADO=pendiente_experto`, se envía una observación, se cambia a **Experto** en Perfil y se valida desde el detalle. Los datos simulados viven en memoria: al recargar la app se pierden las observaciones nuevas.

---

## Cómo está organizado el código

| Carpeta              | Contenido                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`           | Rutas (Expo Router): `(auth)`, `(tabs)`, `nueva-observacion`, `observaciones/[id]`, `observaciones/resultado/[id]`, `especies/[id]`     |
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

**H1 (Frentes A, B y validación)**

- Volver a consultar el detalle si la URL firmada de la imagen venció.
- Ficha de especie con `código` y familia desde `/catalogos/familias`.
- Perfil con `GET /auth/perfil`.
- Cola "Por validar" (`GET /observaciones/pendientes`): con la API real es la única forma de que el experto vea observaciones de otros usuarios.
- Comentario editable del experto y mensajes para 403 y 409.
- Un 401 durante el seguimiento del resultado solo muestra el mensaje; no lleva a inicio de sesión.

**Offline (parte 1)**

- Borrador local, copia local de la foto, cola `pendiente_envio` y caché de catálogos. Mientras tanto, la app sugiere tomar la foto con la cámara del teléfono y subirla desde la galería al tener internet.

**H2:** integración real con la API (autenticación, observaciones, catálogos, validación y sincronización).

**Pruebas:** las pruebas funcionales y de usabilidad del DoD aún no se han registrado en `docs/pruebas/`.

---

## Preguntas abiertas para el Equipo 3

- A qué estado pasa una observación cuando el experto la rechaza (`rechazada`). El mock la deja en `no_concluyente`.
- Los catálogos de ambiente y condición usan los códigos del DoD; el contrato no los enumera.
- La respuesta del modelo trae `umbral_minimo` y `tiempo_inferencia_ms`, que no están en el contrato, y la especie como nombre científico (`Hypanus_guttatus`) en vez de `codigo`.
