# Pruebas de usabilidad: 29 oct 2026

Resultados de las sesiones de usabilidad del MVP, según el plan de [`usabilidad.md`](usabilidad.md) y la sección "Métricas de usabilidad" de [`Dod.md`](../Dod.md).

## Cómo se hizo

- **Participantes:** 5 personas ajenas al desarrollo que no habían visto la app (P1 a P5).
  - P1, P2 y P4 son jóvenes y usan aplicaciones móviles a diario.
  - P3 y P5 son de mayor edad.
- **Teléfono:** Android, con la APK y la API real.
- **Inicio de sesión:** cada persona creó su cuenta y entró antes de las tareas.
  - P1, P2 y P4 lo hicieron solos.
  - A P3 y P5 se les explicó en qué consistía crear una cuenta y entrar con ella.
  - Al abrir la app por segunda vez, todos vieron que no hacía falta volver a entrar.
- **Medición:** el tiempo de la tarea 1 se contó desde que la persona estaba en Inicio, ya con la sesión iniciada. Las tareas 2 y 3 no se cronometraron porque las completaron casi de inmediato.

## Resultados

| Persona | Perfil              | Tarea 1: crear una observación | Tarea 2: ver un resultado anterior | Tarea 3: buscar una especie | Facilidad (1–5) |
| ------- | ------------------- | ------------------------------ | ---------------------------------- | --------------------------- | --------------- |
| P1      | Joven               | 29 s, sin ayuda                | Casi inmediata                     | Casi inmediata              | 5               |
| P2      | Joven               | 41 s, sin ayuda                | Casi inmediata                     | Casi inmediata              | 5               |
| P3      | Mayor edad          | 82 s, sin ayuda                | Casi inmediata                     | Casi inmediata              | 5               |
| P4      | Joven               | 27 s, sin ayuda                | Casi inmediata                     | Casi inmediata              | 5               |
| P5      | Mayor edad          | 95 s, sin ayuda                | Casi inmediata                     | Casi inmediata              | 5               |

**Tarea 1:**

- 5 de 5 personas la completaron sin ayuda.
- Tiempo mediano: 41 s. Promedio: 55 s. Rango: de 27 a 95 s.
- Jóvenes: mediana de 29 s. Personas de mayor edad: 82 y 95 s.

## Criterios de aceptación (DoD)

- [x] Al menos 3 de 5 personas completan la tarea 1 sin ayuda: **5 de 5**.
- [x] El tiempo mediano de la tarea 1 es de 3 minutos (180 s) o menos: **41 s**.
- [x] Ningún error bloqueante sin resolver al cierre de la sesión: **ninguno**.

## Lo que se observó

**Lo que valoraron**

- El vocabulario sencillo, sin palabras técnicas.
- El botón de nueva observación: grande y de un color que resalta.
- Las cinco personas calificaron la app con 5 de 5 en facilidad.

**Problemas encontrados**

| Qué pasó | Personas | Gravedad | Propuesta |
| --- | --- | --- | --- |
| Crear la cuenta e iniciar sesión por primera vez no fue obvio: hubo que explicarles el proceso | P3, P5 | Media: solo pasa la primera vez, pero sin ayuda podrían no llegar a la app | Una línea en la pantalla de entrada que explique para qué es la cuenta y que solo se pide una vez. Más adelante, la pregunta abierta al Equipo 3 sobre registrar observaciones sin cuenta (`discrepancias.md`) |
| Usaban el botón de regresar del teléfono en vez de la barra inferior para cambiar de sección | P3, P5 | Baja: regresar los llevaba a Inicio y desde ahí seguían | Ninguna por ahora. Funciona como esperaban; conviene confirmar que regresar nunca saque de la app a mitad de un registro |

## Limitaciones

- Solo se cronometró la tarea 1, y desde Inicio, sin contar el registro de la cuenta.
- Las tareas 2 y 3 se registraron como "casi inmediatas", sin tiempo exacto.
- No se contaron los errores o desvíos uno por uno. El único desvío visto fue el uso del botón de regresar.
- Las sesiones se hicieron con el equipo presente, así que la explicación de la cuenta a P3 y P5 cuenta como ayuda antes de empezar, no durante la tarea 1.
