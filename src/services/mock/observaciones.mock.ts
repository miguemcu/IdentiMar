import type {
  EstadoObservacion,
  ObservacionDetalle,
  ObservacionesPagina,
  ObservacionInput,
  ObservacionResumen,
  Prediccion,
} from "../../types";
import type {
  FiltrosListadoObservaciones,
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
    imagenUri?: string,
  ): Promise<ObservacionResumen> {
    await simularRetardo();

    const id = `obs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ahora = new Date().toISOString();

    const tipoAmbienteItem = MOCK_TIPOS_AMBIENTE.find(
      (item) => item.codigo === datos.tipo_ambiente,
    ) ?? {
      id: `amb-${Date.now()}`,
      codigo: datos.tipo_ambiente,
      nombre_visible: datos.tipo_ambiente,
    };

    const condicionOrganismoItem = MOCK_CONDICIONES_ORGANISMO.find(
      (item) => item.codigo === datos.condicion_organismo,
    ) ?? {
      id: `cond-${Date.now()}`,
      codigo: datos.condicion_organismo,
      nombre_visible: datos.condicion_organismo,
    };

    const nuevaObservacion: ObservacionDetalle = {
      id,
      estado: "recibido",
      creado_en: ahora,
      fecha_hora_evento: datos.fecha_hora_evento,
      imagen_url:
        imagenUri ||
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
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

        // Distribución: 60% identificado, 25% pendiente_experto, 15% no_concluyente
        const rand = Math.random();
        let nuevoEstado: EstadoObservacion;
        let confianza: number;
        let motivo: string;

        if (rand < 0.6) {
          nuevoEstado = "identificado";
          confianza = Number((0.85 + Math.random() * 0.12).toFixed(2));
          obsFinal.especie_aceptada = especieAleatoria;
          motivo = "Inferencia exitosa con confianza >= 0.85";
        } else if (rand < 0.85) {
          nuevoEstado = "pendiente_experto";
          confianza = Number((0.55 + Math.random() * 0.2).toFixed(2));
          obsFinal.especie_aceptada = null;
          motivo = "Confianza intermedia: derivada a validación experta";
        } else {
          nuevoEstado = "no_concluyente";
          confianza = Number((0.2 + Math.random() * 0.25).toFixed(2));
          obsFinal.especie_aceptada = null;
          motivo = "Confianza insuficiente en la imagen";
        }

        const prediccion: Prediccion = {
          id: `pred-${Date.now()}`,
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

  async obtenerObservacion(id: string): Promise<ObservacionDetalle> {
    await simularRetardo();

    const obs = this.observaciones.find((o) => o.id === id);
    if (!obs) {
      throw new Error(`Observación no encontrada: ${id}`);
    }

    // Retorna una copia profunda para evitar mutaciones externas involuntarias
    return JSON.parse(JSON.stringify(obs));
  }

  async listarPendientes(
    filtros?: Omit<FiltrosListadoObservaciones, "estado">,
  ): Promise<ObservacionesPagina> {
    await simularRetardo();

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
      throw new Error(`Observación no encontrada: ${id}`);
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
