# Pruebas de usabilidad

Plan y registro de las sesiones de usabilidad del MVP, según la sección "Métricas de usabilidad" de [`Dod.md`](../Dod.md).

- **Estado:** hecho el 29 oct con 5 personas. Resultados en [`usabilidad-2026-10-29.md`](usabilidad-2026-10-29.md).
- **Cuando se hagan:** copiar la sección "Registro" a `usabilidad-AAAA-MM-DD.md` con la fecha de la sesión y llenarla.

## Qué se busca

Saber si una persona que nunca ha visto la app puede usarla sin ayuda, sobre todo para registrar una raya.

## Participantes

- De 3 a 5 personas ajenas al desarrollo que no hayan visto la app. Idealmente alguien que pesque o trabaje en la costa.
- Sin datos personales: cada persona se anota con un código (P1, P2…).

## Preparación

1. Instalar la APK en un teléfono Android con una cuenta de prueba (`e1.usuario@ejemplo.co`) ya iniciada.
2. **Despertar el servidor** unos minutos antes: abrir la app y enviar una observación de prueba. Render y el servicio de visión se duermen, y el primer envío puede tardar o quedar "No se pudo identificar".
3. Tener a mano una foto de raya en la galería, por si no hay una raya real para fotografiar.
4. Un cronómetro y esta hoja.

## Guion

Leer a cada persona: *"Vamos a probar la aplicación, no a ti. Haz cada tarea como creas; si te quedas sin saber qué hacer, dilo en voz alta. No te puedo ayudar mientras la haces."*

| Tarea | Qué se le pide                                                            | Termina cuando                               |
| ----- | ------------------------------------------------------------------------- | -------------------------------------------- |
| 1     | "Viste una raya en la playa. Regístrala en la app con una foto."          | Ve la pantalla del resultado                  |
| 2     | "Busca qué resultado tuvo una raya que registraste antes."                | Abre el detalle de una observación anterior   |
| 3     | "Busca información sobre la raya *Hypanus guttatus*."                     | Abre la ficha de la especie                   |

Al terminar cada tarea, preguntar: *"Del 1 al 5, ¿qué tan fácil fue?"* (1 = muy difícil, 5 = muy fácil).

## Qué se mide en cada tarea

- **Tiempo** en segundos, desde que termina de oír la tarea hasta que llega al final.
- **Éxito:** sí, si la completó sin ayuda.
- **Errores o desvíos:** veces que entró a una pantalla que no era o tuvo que devolverse.
- **Facilidad:** de 1 a 5.
- **Notas:** dónde dudó y lo que dijo.

## Criterios de aceptación (DoD)

- Al menos 3 de 5 personas completan la tarea 1 sin ayuda.
- El tiempo mediano de la tarea 1 es de 3 minutos (180 s) o menos.
- Ningún error bloqueante sin resolver al cierre de la sesión.

---

## Registro

- **Fecha:**
- **Lugar:**
- **Quién guía la sesión:**
- **Teléfono y versión de la app:**

| Persona | Tarea | Tiempo (s) | Éxito (sí/no) | Errores | Facilidad (1–5) | Notas |
| ------- | ----- | ---------- | ------------- | ------- | --------------- | ----- |
| P1      | 1     |            |               |         |                 |       |
| P1      | 2     |            |               |         |                 |       |
| P1      | 3     |            |               |         |                 |       |
| P2      | 1     |            |               |         |                 |       |
| P2      | 2     |            |               |         |                 |       |
| P2      | 3     |            |               |         |                 |       |
| P3      | 1     |            |               |         |                 |       |
| P3      | 2     |            |               |         |                 |       |
| P3      | 3     |            |               |         |                 |       |
| P4      | 1     |            |               |         |                 |       |
| P4      | 2     |            |               |         |                 |       |
| P4      | 3     |            |               |         |                 |       |
| P5      | 1     |            |               |         |                 |       |
| P5      | 2     |            |               |         |                 |       |
| P5      | 3     |            |               |         |                 |       |

**Resultado por tarea**

| Tarea | Completaron sin ayuda | Tiempo mediano (s) | Facilidad promedio |
| ----- | --------------------- | ------------------ | ------------------ |
| 1     | de                    |                    |                    |
| 2     | de                    |                    |                    |
| 3     | de                    |                    |                    |

**Criterios**

- [ ] Tarea 1 sin ayuda: al menos 3 de 5.
- [ ] Tiempo mediano de la tarea 1 ≤ 180 s.
- [ ] Sin errores bloqueantes sin resolver.

**Problemas encontrados** (qué pasó, cuántas personas, qué tan grave y qué se propone):

-
