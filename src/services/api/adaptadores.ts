import type {
  EstadoObservacion,
  Especie,
  ObservacionDetalle,
  ObservacionesPagina,
  ObservacionResumen,
  Prediccion,
  TransicionEstado,
  UsuarioPublico,
  ValidacionExperta,
} from '../../types';

/**
 * Convierte las observaciones del backend a la forma del contrato, que es la
 * que usan las pantallas. El backend difiere en (ver docs/discrepancias.md):
 * - `estado` como objeto `{ codigo, nombre_visible, … }` en vez de texto;
 * - números como texto (`"8.094900"`);
 * - `imagen.url_firmada` en vez de `imagen_url`;
 * - `prediccion`, `validacion` e `historial` en vez de `prediccion_original`,
 *   `validacion_experta` e `historial_estados`, con estados y actor como objetos;
 * - en la predicción, `especie` en vez de `especie_propuesta` y
 *   `version_modelo` como objeto `{ id, version }`.
 * Se aceptan las dos formas, así sigue funcionando si el backend se alinea.
 */

// Lo que llega del servidor no tiene una forma fija: se lee campo por campo.
type Crudo = Record<string, any>;

function codigoEstado(valor: unknown): EstadoObservacion {
  return (typeof valor === 'string' ? valor : (valor as Crudo | null)?.codigo) as EstadoObservacion;
}

function numero(valor: unknown): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : undefined;
}

function numeroONulo(valor: unknown): number | null {
  return numero(valor) ?? null;
}

function especie(valor: unknown, codigo?: unknown): Especie | null {
  if (valor && typeof valor === 'object') return valor as Especie;
  // Solo el código: se arma lo mínimo para mostrarla.
  if (typeof codigo === 'string' && codigo) {
    return { id: '', codigo, nombre_cientifico: codigo.replace(/_/g, ' ') };
  }
  return null;
}

function urlImagen(o: Crudo): string | undefined {
  return (
    o.imagen_url ??
    o.imagen?.url_firmada ??
    (Array.isArray(o.imagenes) ? o.imagenes[0]?.url_firmada : undefined) ??
    undefined
  );
}

function prediccion(p: Crudo | null | undefined): Prediccion | null {
  if (!p) return null;
  const propuesta = especie(p.especie_propuesta ?? p.especie, p.especie_codigo ?? p.especie_propuesta_codigo);
  if (!propuesta) return null;
  return {
    id: p.id,
    especie_propuesta: propuesta,
    confianza: numero(p.confianza) ?? 0,
    // El backend la envía como objeto { id, version }.
    version_modelo:
      typeof p.version_modelo === 'string' ? p.version_modelo : (p.version_modelo?.version ?? ''),
    creado_en: p.creado_en,
  };
}

function usuarioMinimo(u: Crudo | null | undefined): UsuarioPublico {
  return {
    id: u?.id ?? '',
    nombre_completo: u?.nombre_completo ?? 'Experto',
    correo: u?.correo ?? '',
    rol: u?.rol ?? 'experto',
  };
}

function validacion(v: Crudo | null | undefined): ValidacionExperta | null {
  if (!v) return null;
  return {
    id: v.id,
    decision: v.decision,
    especie_final: especie(v.especie_final, v.especie_final_codigo),
    comentario: v.comentario ?? null,
    experto: usuarioMinimo(v.experto ?? v.usuario),
    creado_en: v.creado_en,
  };
}

function transicion(t: Crudo): TransicionEstado {
  return {
    estado_anterior: t.estado_anterior ? codigoEstado(t.estado_anterior) : null,
    estado_nuevo: codigoEstado(t.estado_nuevo),
    actor:
      typeof t.actor === 'string' ? t.actor : (t.actor?.nombre_completo ?? null),
    motivo: t.motivo ?? null,
    creado_en: t.creado_en,
  };
}

export function aResumen(o: Crudo): ObservacionResumen {
  const pred = o.prediccion_original ?? o.prediccion;
  return {
    id: o.id,
    estado: codigoEstado(o.estado),
    creado_en: o.creado_en,
    fecha_hora_evento: o.fecha_hora_evento,
    imagen_url: urlImagen(o),
    especie_aceptada: especie(o.especie_aceptada, o.especie_aceptada_codigo),
    confianza: numeroONulo(o.confianza ?? pred?.confianza),
  };
}

export function aDetalle(o: Crudo): ObservacionDetalle {
  const historial = o.historial_estados ?? o.historial;
  return {
    ...aResumen(o),
    usuario: o.usuario,
    latitud: numero(o.latitud),
    longitud: numero(o.longitud),
    precision_gps_metros: numeroONulo(o.precision_gps_metros),
    tipo_ambiente: o.tipo_ambiente,
    condicion_organismo: o.condicion_organismo,
    observaciones_usuario: o.observaciones_usuario ?? null,
    prediccion_original: prediccion(o.prediccion_original ?? o.prediccion),
    validacion_experta: validacion(o.validacion_experta ?? o.validacion),
    historial_estados: Array.isArray(historial) ? historial.map(transicion) : [],
  };
}

export function aPagina(p: Crudo): ObservacionesPagina {
  return {
    items: Array.isArray(p.items) ? p.items.map(aResumen) : [],
    pagina: numero(p.pagina) ?? 1,
    tamano: numero(p.tamano) ?? 20,
    total: numero(p.total) ?? 0,
  };
}
