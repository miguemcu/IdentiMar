# IdentiMar — App móvil (Equipo 1)

App móvil de registro e identificación de batoideos en el Urabá antioqueño
(Proyecto Integrador I, UdeA + INVEMAR). Interfaz 100 % en español.

## Stack

- React Native + Expo (Expo Router en src/app) + TypeScript estricto.
- Estilos: NativeWind (className). No uses StyleSheet salvo que NativeWind
  no pueda expresar algo; no mezcles ambos estilos en un mismo componente.
- Debe funcionar igual en Android e iOS. Todo es React Native: usa View, Text,
  Pressable, Image, ScrollView, TextInput. Nada de div, button, input, CSS,
  localStorage ni librerías web (shadcn/ui, Radix, Phosphor web, etc.).

## Estructura

- src/app/ rutas · src/components/ UI reutilizable · src/constants/ constantes
- src/hooks/ hooks · src/contexts/ sesión y cola de envío
- src/types/ tipos con la forma del contrato
- src/services/ única capa que usan las pantallas: interfaces por dominio,
  mock/ (datos simulados), api/ (backend real) y local/ (borrador, fotos,
  cola de envío, caché y red)
- scripts/ pruebas de los servicios desde el computador (ver docs/pruebas/)
- docs/ contrato, mockup, DoD, estado, discrepancias y pruebas (fuera de la
  compilación). El estado vigente está en docs/estado_actual.md.
- No crees archivos en docs/ salvo que se pida.

## Diseño (NO inventes otro)

Sistema "Bentos Costero". Los tokens están en tailwind.config.js:
ocean #0284C7 (acciones principales), ocre #FCD34D (secundarios),
superficie #F4F6F8, texto pizarra #1E293B, más los de estado
(éxito, advertencia, peligro) del mockup.

- Usa los tokens por nombre (bg-ocean, text-slate-deep). Nunca escribas
  colores hexadecimales dentro de componentes.
- Fuentes: Nunito (títulos) y Source Sans 3 (texto), cargadas con expo-font
  o @expo-google-fonts; no con @import de CSS.
- Solo modo claro. No agregues modo oscuro salvo que se pida.
- Íconos: @expo/vector-icons o los SVG del mockup. Nunca emojis como íconos.

## NativeWind: límites a respetar

- React Native no tiene CSS grid: reemplaza grid-cols-\* por flex y gap.
- No uses container, min-h-screen, hover:, focus-visible: ni otras clases
  pensadas para navegador. Para el estado presionado usa Pressable/active:.
- Respeta las safe areas (react-native-safe-area-context) en cabeceras,
  barras inferiores y botones fijos.
- Si dudas de que una clase funcione en NativeWind, di cuál y propón alternativa
  en vez de adivinar.

## Referencia visual

El mockup está en docs/mockup_figma/ (solo App.tsx e index.css, hecho en React +
Vite + Tailwind v4). Es únicamente referencia visual: no copies su código,
reescribe cada pantalla en React Native y traduce sus clases a lo soportado.

## Contrato con el backend

El contrato OpenAPI está en docs/contrato_integracion.yaml. La API la hace el
Equipo 3 y el modelo de identificación el Equipo 2. La app ya está integrada:
EXPO_PUBLIC_USE_API elige entre datos simulados (false) y la API real (true).

- Las pantallas y el mock usan siempre la forma del contrato (campos en
  español, UUID, estados del contrato). Lo que el backend envía o pide distinto
  se adapta solo dentro de src/services/api/ y se anota en docs/discrepancias.md.
- Las llamadas de red van solo en src/services/api/, por el cliente de http.ts,
  y solo a endpoints del contrato.
- Los mensajes de error para el usuario pasan por src/services/errores.ts.
- Si una pantalla necesita un dato que el contrato no tiene, o el contrato exige
  uno que la pantalla no recoge, avísalo en vez de inventarlo.
- Nunca subas contraseñas ni tokens al repo (van en .env, que no se versiona).

## Principios

- Textos para usuarios generales, sin jerga técnica.
- Botones táctiles de al menos 44x44 pt y buen contraste (uso en exteriores).
- No agregues dependencias sin justificarlas.
- Antes de dar una tarea por terminada ejecuta `npx tsc --noEmit`.

## Reglas de trabajo

- Una tarea por commit (convención de nombres tomada de
  https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13), confirmaciones pequeñas.
- No editar archivos compartidos (rutas raíz, tipos, tema, services) fuera de
  tu tarea; si hace falta un cambio, descríbelo en el PR.
- Antes de escribir código: proponer un plan y esperar confirmación.
- Antes de dar algo por terminado: `npx tsc --noEmit` y `npx expo lint` sin
  errores, y `npx tsx scripts/probar-servicios.ts` si tocaste src/services/.
- No agregar dependencias sin avisar.
