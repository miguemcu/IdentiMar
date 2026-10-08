import {
  authService,
  catalogosService,
  observacionesService,
  validacionService,
} from "../src/services";
import type { ObservacionInput } from "../src/types";

async function ejecutarPrueba() {
  console.log("=== 1. Prueba de Catálogos ===");
  const especies = await catalogosService.obtenerEspecies();
  console.log(`Especies cargadas: ${especies.length}`);
  especies.forEach((esp) => {
    console.log(
      ` - [${esp.codigo}] ${esp.nombre_cientifico} (${esp.nombre_comun})`,
    );
  });
  if (especies.length !== 5) {
    throw new Error(
      `Se esperaban 5 especies, pero se obtuvieron ${especies.length}`,
    );
  }

  console.log("\n=== 2. Prueba de Autenticación ===");
  const loginRes = await authService.login({
    correo: "ana.torres@ejemplo.co",
    password: "password123",
  });
  console.log(
    `Usuario autenticado: ${loginRes.usuario.nombre_completo} (Rol: ${loginRes.usuario.rol})`,
  );

  console.log("\n=== 3. Creación y avance automático de Observación ===");
  const datosNuevaObs: ObservacionInput = {
    fecha_hora_evento: new Date().toISOString(),
    latitud: 8.7476,
    longitud: -76.6414,
    precision_gps_metros: 3.5,
    tipo_ambiente: "marino",
    condicion_organismo: "vivo",
    observaciones_usuario:
      "Ejemplar visto nadando cerca a la playa en aguas claras.",
  };

  const nueva = await observacionesService.crearObservacion(datosNuevaObs);
  console.log(`Observación creada ID: ${nueva.id}`);
  console.log(`Estado inicial reportado: ${nueva.estado}`);

  // Monitoreo del avance de estados
  const estadosVistos = new Set<string>([nueva.estado]);
  const tiempoInicio = Date.now();
  const maxEsperaMs = 6000;

  while (Date.now() - tiempoInicio < maxEsperaMs) {
    await new Promise((r) => setTimeout(r, 400));
    const detalle = await observacionesService.obtenerObservacion(nueva.id);

    if (!estadosVistos.has(detalle.estado)) {
      estadosVistos.add(detalle.estado);
      console.log(
        ` -> Transición detectada a estado: "${detalle.estado}" (${Date.now() - tiempoInicio} ms)`,
      );
    }

    if (
      detalle.estado === "identificado" ||
      detalle.estado === "no_concluyente" ||
      detalle.estado === "pendiente_experto"
    ) {
      console.log(`\nEstado final alcanzado: "${detalle.estado}"`);
      console.log(`Confianza: ${detalle.confianza ?? "N/A"}`);
      console.log(
        `Especie aceptada: ${detalle.especie_aceptada?.nombre_cientifico ?? "Ninguna"}`,
      );
      console.log(
        `Historial de transiciones (${detalle.historial_estados?.length ?? 0} eventos):`,
      );
      detalle.historial_estados?.forEach((h, idx) => {
        console.log(
          `   ${idx + 1}. [${h.estado_anterior ?? "inicio"} -> ${h.estado_nuevo}] Motivo: "${h.motivo}"`,
        );
      });

      // Prueba adicional: si quedó en pendiente_experto o no_concluyente, probamos validación
      if (
        detalle.estado === "pendiente_experto" ||
        detalle.estado === "no_concluyente"
      ) {
        console.log("\n=== 4. Prueba de Validación Experta ===");
        const validada = await validacionService.validarObservacion(
          detalle.id,
          {
            decision: "confirmada",
            especie_final_codigo: "URO_MICR",
            comentario: "Confirmada por el experto en prueba automatizada.",
          },
        );
        console.log(`Nuevo estado tras validación: "${validada.estado}"`);
        console.log(
          `Experto validador: ${validada.validacion_experta?.experto.nombre_completo}`,
        );
      }
      break;
    }
  }

  if (!estadosVistos.has("procesando")) {
    throw new Error('No se detectó el paso por el estado "procesando"');
  }

  console.log("\n=== PRUEBA DE SERVICIOS COMPLETADA CON ÉXITO ===\n");
}

ejecutarPrueba().catch((err) => {
  console.error("Error durante la prueba de servicios:", err);
  process.exit(1);
});
