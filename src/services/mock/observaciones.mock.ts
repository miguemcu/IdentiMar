import type {
  DetalleError,
  EstadoObservacion,
  ObservacionDetalle,
  ObservacionesPagina,
  ObservacionInput,
  ObservacionResumen,
  Prediccion,
} from "../../types";
import { ErrorServicio } from "../errores";
import type {
  FiltrosListadoObservaciones,
  ImagenObservacion,
  IObservacionesService,
} from "../observaciones.service";
import { simularRetardo } from "./delay";
import {
  MOCK_CONDICIONES_ORGANISMO,
  MOCK_ESPECIES,
  MOCK_OBSERVACIONES_INICIALES,
  MOCK_TIPOS_AMBIENTE,
  MOCK_USUARIOS,
} from "./mockData";

/** UUID v4 de prueba; el backend real asigna los suyos. */
function uuidSimulado(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Permite probar los errores del contrato sin backend:
 * EXPO_PUBLIC_MOCK_ERROR = 400 | 401 | 413 | red
 */
function errorSimulado(): ErrorServicio | null {
  switch (process.env.EXPO_PUBLIC_MOCK_ERROR) {
    case "400":
      return new ErrorServicio(400, {
        codigo: "validacion-fallida",
        mensaje: "Uno o más campos no cumplen las restricciones.",
        detalles: [{ campo: "latitud", problema: "Debe estar entre -90 y 90." }],
      });
    case "401":
      return new ErrorServicio(401, {
        codigo: "no-autenticado",
        mensaje: "Se requiere autenticación para acceder a este recurso.",
      });
    case "413":
      return new ErrorServicio(413, {
        codigo: "imagen-muy-grande",
        mensaje: "Imagen demasiado grande.",
      });
    case "red":
      return new ErrorServicio(0, {
        codigo: "sin-conexion",
        mensaje: "No hay conexión.",
      });
    default:
      return null;
  }
}

/**
 * Umbral que simula el `umbral_minimo` del modelo (Equipo 2). Solo vive en el
 * mock: la app muestra el estado y la confianza que defina el backend.
 */
const UMBRAL_MINIMO_MODELO = 0.7;

const RESULTADOS_MODELO = [
  "identificado",
  "pendiente_experto",
  "no_concluyente",
] as const;
type ResultadoModelo = (typeof RESULTADOS_MODELO)[number];

/**
 * Resultado final de la inferencia simulada. EXPO_PUBLIC_MOCK_RESULTADO lo
 * fuerza; si está vacío: 60 % identificado, 25 % pendiente_experto, 15 % no_concluyente.
 */
function resultadoSimulado(): ResultadoModelo {
  const forzado = process.env.EXPO_PUBLIC_MOCK_RESULTADO;
  const valido = RESULTADOS_MODELO.find((r) => r === forzado);
  if (valido) return valido;

  const rand = Math.random();
  if (rand < 0.6) return "identificado";
  if (rand < 0.85) return "pendiente_experto";
  return "no_concluyente";
}

/** Número aleatorio entre min y max con dos decimales. */
function confianzaEntre(min: number, max: number): number {
  return Number((min + Math.random() * (max - min)).toFixed(2));
}

/** Aplica las mismas restricciones que ObservacionInput y la parte `imagen` del contrato. */
function validarEntrada(
  datos: ObservacionInput,
  imagen: ImagenObservacion,
): DetalleError[] {
  const detalles: DetalleError[] = [];
  const enRango = (v: unknown, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

  if (Number.isNaN(Date.parse(datos.fecha_hora_evento))) {
    detalles.push({
      campo: "fecha_hora_evento",
      problema: "Debe ser una fecha válida.",
    });
  }
  if (!enRango(datos.latitud, -90, 90)) {
    detalles.push({ campo: "latitud", problema: "Debe estar entre -90 y 90." });
  }
  if (!enRango(datos.longitud, -180, 180)) {
    detalles.push({
      campo: "longitud",
      problema: "Debe estar entre -180 y 180.",
    });
  }
  if (
    datos.precision_gps_metros != null &&
    !enRango(datos.precision_gps_metros, 0, Infinity)
  ) {
    detalles.push({
      campo: "precision_gps_metros",
      problema: "No puede ser negativa.",
    });
  }
  if (!MOCK_TIPOS_AMBIENTE.some((i) => i.codigo === datos.tipo_ambiente)) {
    detalles.push({ campo: "tipo_ambiente", problema: "Elige una opción." });
  }
  if (
    !MOCK_CONDICIONES_ORGANISMO.some(
      (i) => i.codigo === datos.condicion_organismo,
    )
  ) {
    detalles.push({
      campo: "condicion_organismo",
      problema: "Elige una opción.",
    });
  }
  if ((datos.observaciones_usuario?.length ?? 0) > 2000) {
    detalles.push({
      campo: "observaciones_usuario",
      problema: "Máximo 2000 caracteres.",
    });
  }
  if (imagen.mimeType !== "image/jpeg" && imagen.mimeType !== "image/png") {
    detalles.push({ campo: "imagen", problema: "Debe ser JPEG o PNG." });
  }
  return detalles;
}

export class ObservacionesMockService implements IObservacionesService {
  private observaciones: ObservacionDetalle[] = [
    ...MOCK_OBSERVACIONES_INICIALES,
  ];

  private aResumen(obs: ObservacionDetalle): ObservacionResumen {
    return {
      id: obs.id,
      estado: obs.estado,
      creado_en: obs.creado_en,
      fecha_hora_evento: obs.fecha_hora_evento,
      imagen_url: obs.imagen_url,
      especie_aceptada: obs.especie_aceptada,
      confianza: obs.confianza,
    };
  }

  async crearObservacion(
    datos: ObservacionInput,
    imagen: ImagenObservacion,
  ): Promise<ObservacionResumen> {
    await simularRetardo();

    const simulado = errorSimulado();
    if (simulado) throw simulado;

    const detalles = validarEntrada(datos, imagen);
    if (detalles.length > 0) {
      throw new ErrorServicio(400, {
        codigo: "validacion-fallida",
        mensaje: "Uno o más campos no cumplen las restricciones.",
        detalles,
      });
    }

    const id = uuidSimulado();
    const ahora = new Date().toISOString();

    // validarEntrada ya garantizó que ambos códigos existen en el catálogo.
    const tipoAmbienteItem = MOCK_TIPOS_AMBIENTE.find(
      (item) => item.codigo === datos.tipo_ambiente,
    )!;
    const condicionOrganismoItem = MOCK_CONDICIONES_ORGANISMO.find(
      (item) => item.codigo === datos.condicion_organismo,
    )!;

    const nuevaObservacion: ObservacionDetalle = {
      id,
      estado: "recibido",
      creado_en: ahora,
      fecha_hora_evento: datos.fecha_hora_evento,
      imagen_url: imagen.uri,
      especie_aceptada: null,
      confianza: null,
      usuario: MOCK_USUARIOS.usuario,
      latitud: datos.latitud,
      longitud: datos.longitud,
      precision_gps_metros: datos.precision_gps_metros ?? null,
      tipo_ambiente: tipoAmbienteItem,
      condicion_organismo: condicionOrganismoItem,
      observaciones_usuario: datos.observaciones_usuario ?? null,
      prediccion_original: null,
      validacion_experta: null,
      historial_estados: [
        {
          estado_anterior: null,
          estado_nuevo: "recibido",
          actor: "Ana María Torres",
          motivo: "Registro inicial de la observación",
          creado_en: ahora,
        },
      ],
    };

    // Se agrega al almacén
    this.observaciones.unshift(nuevaObservacion);

    // Iniciar avance asíncrono automático:
    // recibido -> procesando -> identificado | no_concluyente | pendiente_experto
    this.programarAvanceAutomatico(id);

    return this.aResumen(nuevaObservacion);
  }

  private programarAvanceAutomatico(id: string): void {
    // Paso 1: Transición a "procesando" tras 1.2 segundos
    setTimeout(() => {
      const obs = this.observaciones.find((o) => o.id === id);
      if (!obs || obs.estado !== "recibido") return;

      const tiempoProcesando = new Date().toISOString();
      obs.estado = "procesando";
      obs.historial_estados = obs.historial_estados || [];
      obs.historial_estados.push({
        estado_anterior: "recibido",
        estado_nuevo: "procesando",
        actor: null,
        motivo: "Inferencia de visión artificial en cola",
        creado_en: tiempoProcesando,
      });

      // Paso 2: Transición final tras 1.5 segundos adicionales
      setTimeout(() => {
        const obsFinal = this.observaciones.find((o) => o.id === id);
        if (!obsFinal || obsFinal.estado !== "procesando") return;

        const tiempoFinal = new Date().toISOString();
        const especieAleatoria =
          MOCK_ESPECIES[Math.floor(Math.random() * MOCK_ESPECIES.length)];

        // Por encima del umbral identifica; por debajo, la división entre
        // pendiente_experto y no_concluyente es solo del mock (el contrato no la define).
        const nuevoEstado = resultadoSimulado();
        let confianza: number;
        let motivo: string;

        if (nuevoEstado === "identificado") {
          confianza = confianzaEntre(UMBRAL_MINIMO_MODELO, 0.99);
          obsFinal.especie_aceptada = especieAleatoria;
          motivo = `Inferencia exitosa con confianza >= ${UMBRAL_MINIMO_MODELO}`;
        } else if (nuevoEstado === "pendiente_experto") {
          confianza = confianzaEntre(0.45, UMBRAL_MINIMO_MODELO - 0.01);
          obsFinal.especie_aceptada = null;
          motivo = "Confianza intermedia: derivada a validación experta";
        } else {
          confianza = confianzaEntre(0.15, 0.44);
          obsFinal.especie_aceptada = null;
          motivo = "Confianza insuficiente en la imagen";
        }

        const prediccion: Prediccion = {
          id: uuidSimulado(),
          especie_propuesta: especieAleatoria,
          confianza,
          version_modelo: "1.0.0",
          creado_en: tiempoFinal,
        };

        obsFinal.estado = nuevoEstado;
        obsFinal.confianza = confianza;
        obsFinal.prediccion_original = prediccion;
        obsFinal.historial_estados?.push({
          estado_anterior: "procesando",
          estado_nuevo: nuevoEstado,
          actor: null,
          motivo,
          creado_en: tiempoFinal,
        });
      }, 1500);
    }, 1200);
  }

  async listarObservaciones(
    filtros?: FiltrosListadoObservaciones,
  ): Promise<ObservacionesPagina> {
    await simularRetardo();

    let resultado = [...this.observaciones];

    if (filtros?.estado) {
      resultado = resultado.filter((o) => o.estado === filtros.estado);
    }

    const pagina = filtros?.pagina ?? 1;
    const tamano = filtros?.tamano ?? 20;
    const total = resultado.length;

    const inicio = (pagina - 1) * tamano;
    const fin = inicio + tamano;
    const items = resultado.slice(inicio, fin).map((o) => this.aResumen(o));

    return {
      items,
      pagina,
      tamano,
      total,
    };
  }

  /** Consultas al detalle por id, para los errores que dependen del número de consulta. */
  private consultasDetalle = new Map<string, number>();

  async obtenerObservacion(id: string): Promise<ObservacionDetalle> {
    await simularRetardo();

    const consulta = (this.consultasDetalle.get(id) ?? 0) + 1;
    this.consultasDetalle.set(id, consulta);

    // EXPO_PUBLIC_MOCK_ERROR=401-seguimiento: la primera consulta responde y
    // las siguientes dan 401, como si la sesión venciera durante el seguimiento.
    if (process.env.EXPO_PUBLIC_MOCK_ERROR === "401-seguimiento" && consulta > 1) {
      throw new ErrorServicio(401, {
        codigo: "no-autenticado",
        mensaje: "Se requiere autenticación para acceder a este recurso.",
      });
    }

    const obs = this.observaciones.find((o) => o.id === id);
    if (!obs) {
      throw new Error(`Observación no encontrada: ${id}`);
    }

    // Retorna una copia profunda para evitar mutaciones externas involuntarias
    const copia: ObservacionDetalle = JSON.parse(JSON.stringify(obs));

    // EXPO_PUBLIC_MOCK_ERROR=imagen-vencida: la primera consulta de cada registro
    // trae una ruta local que no existe (como una URL firmada vencida, sin red);
    // la siguiente trae la foto real. Con imagen-vencida-siempre, nunca carga.
    const forzado = process.env.EXPO_PUBLIC_MOCK_ERROR;
    if (
      (forzado === "imagen-vencida" && consulta === 1) ||
      forzado === "imagen-vencida-siempre"
    ) {
      copia.imagen_url = "file:///identimar-mock/imagen-vencida.jpg";
    }
    return copia;
  }

  async listarPendientes(
    filtros?: Omit<FiltrosListadoObservaciones, "estado">,
  ): Promise<ObservacionesPagina> {
    await simularRetardo();

    // EXPO_PUBLIC_MOCK_ERROR=pendientes | 403-pendientes: la cola falla.
    const forzado = process.env.EXPO_PUBLIC_MOCK_ERROR;
    if (forzado === "pendientes") {
      throw new ErrorServicio(0, { codigo: "sin-conexion", mensaje: "No hay conexión." });
    }
    if (forzado === "403-pendientes") {
      throw new ErrorServicio(403, {
        codigo: "sin-permiso",
        mensaje: "No tienes permiso para realizar esta acción.",
      });
    }

    const pendientes = this.observaciones.filter(
      (o) => o.estado === "pendiente_experto" || o.estado === "no_concluyente",
    );

    const pagina = filtros?.pagina ?? 1;
    const tamano = filtros?.tamano ?? 20;
    const total = pendientes.length;

    const inicio = (pagina - 1) * tamano;
    const fin = inicio + tamano;
    const items = pendientes.slice(inicio, fin).map((o) => this.aResumen(o));

    return {
      items,
      pagina,
      tamano,
      total,
    };
  }

  aplicarValidacion(
    id: string,
    validacion: import("../../types").ValidacionInput,
  ): ObservacionDetalle {
    const obs = this.observaciones.find((o) => o.id === id);
    if (!obs) {
      throw new ErrorServicio(404, {
        codigo: "recurso-no-encontrado",
        mensaje: `Observación no encontrada: ${id}`,
      });
    }
    // Como el contrato: solo se valida una vez y en estos dos estados.
    if (
      obs.validacion_experta ||
      (obs.estado !== "pendiente_experto" && obs.estado !== "no_concluyente")
    ) {
      throw new ErrorServicio(409, {
        codigo: "estado-invalido",
        mensaje: "La observación no está en un estado que admita validación.",
      });
    }

    const estadoAnterior = obs.estado;
    let nuevoEstado: EstadoObservacion;
    let especieFinal = null;

    if (validacion.decision === "confirmada") {
      nuevoEstado = "validado";
      especieFinal =
        obs.prediccion_original?.especie_propuesta ??
        (validacion.especie_final_codigo
          ? (MOCK_ESPECIES.find(
              (e) => e.codigo === validacion.especie_final_codigo,
            ) ?? null)
          : null);
      obs.especie_aceptada = especieFinal;
    } else if (validacion.decision === "corregida") {
      nuevoEstado = "corregido";
      especieFinal = validacion.especie_final_codigo
        ? (MOCK_ESPECIES.find(
            (e) => e.codigo === validacion.especie_final_codigo,
          ) ?? null)
        : null;
      obs.especie_aceptada = especieFinal;
    } else {
      nuevoEstado = "no_concluyente";
      obs.especie_aceptada = null;
    }

    const ahora = new Date().toISOString();
    obs.estado = nuevoEstado;
    obs.validacion_experta = {
      id: `val-${Date.now()}`,
      decision: validacion.decision,
      especie_final: especieFinal,
      comentario: validacion.comentario ?? null,
      experto: MOCK_USUARIOS.experto,
      creado_en: ahora,
    };

    obs.historial_estados = obs.historial_estados || [];
    obs.historial_estados.push({
      estado_anterior: estadoAnterior,
      estado_nuevo: nuevoEstado,
      actor: MOCK_USUARIOS.experto.nombre_completo,
      motivo:
        validacion.comentario ?? `Validación experta: ${validacion.decision}`,
      creado_en: ahora,
    });

    return JSON.parse(JSON.stringify(obs));
  }
}
