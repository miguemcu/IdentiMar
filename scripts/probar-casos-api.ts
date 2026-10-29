// Casos de las pruebas funcionales del DoD contra el backend desplegado.
// Crea observaciones de prueba con las cuentas del Equipo 1. Las contraseñas
// van por variables de entorno (nunca en el repo):
//   E1_USUARIO_CLAVE=... E1_EXPERTO_CLAVE=... FOTO_RAYA=ruta/a/raya.jpg \
//   npx tsx --import ./scripts/node/preparar.mjs scripts/probar-casos-api.ts
// FOTO_NO_RAYA (opcional): una foto sin raya, para obtener una observación
// que el experto pueda validar.
import { AuthApiService } from '../src/services/api/auth.api';
import { CatalogosApiService } from '../src/services/api/catalogos.api';
import { ObservacionesApiService } from '../src/services/api/observaciones.api';
import { ValidacionApiService } from '../src/services/api/validacion.api';
import { API_URL } from '../src/services/api/config';
import { borrarSesion, guardarSesion, tokenDeRenovacion } from '../src/services/api/sesion';
import { ErrorServicio, mensajeError, erroresAuth, erroresValidacion } from '../src/services/errores';
import { fechaIsoLocal } from '../src/constants/formato';
import type { EstadoObservacion, ObservacionInput } from '../src/types';
import type { ImagenObservacion } from '../src/services';

const USUARIO = 'e1.usuario@ejemplo.co';
const EXPERTO = 'e1.experto@ejemplo.co';
// preparar.mjs deja las fotos como URL file:// en *_URL.
const { E1_USUARIO_CLAVE, E1_EXPERTO_CLAVE, FOTO_RAYA_URL, FOTO_NO_RAYA_URL, FOTO_PESADA_URL, FOTO_GIF_URL } = process.env;

const auth = new AuthApiService();
const catalogos = new CatalogosApiService();
const observaciones = new ObservacionesApiService();
const validacion = new ValidacionApiService();

const resultados: { caso: string; ok: boolean; detalle: string }[] = [];

async function caso(nombre: string, prueba: () => Promise<string>) {
  const inicio = Date.now();
  try {
    const detalle = await prueba();
    resultados.push({ caso: nombre, ok: true, detalle: `${detalle} (${((Date.now() - inicio) / 1000).toFixed(1)} s)` });
  } catch (e) {
    const detalle = e instanceof ErrorServicio ? `${e.status} ${JSON.stringify(e.cuerpo)}` : e instanceof Error ? e.message : String(e);
    resultados.push({ caso: nombre, ok: false, detalle });
  }
  const r = resultados.at(-1)!;
  console.log(`${r.ok ? 'APROBADO' : 'FALLIDO '} | ${r.caso} | ${r.detalle}`);
}

function esperar(condicion: boolean, mensaje: string) {
  if (!condicion) throw new Error(mensaje);
}

async function errorDe(promesa: Promise<unknown>): Promise<ErrorServicio> {
  const e = await promesa.then(() => null, (err: unknown) => err);
  esperar(e instanceof ErrorServicio, 'Se esperaba un error del servicio');
  return e as ErrorServicio;
}

async function entrar(correo: string, password: string) {
  const resp = await auth.login({ correo, password });
  guardarSesion(resp);
  return resp;
}

function datos(notas: string): ObservacionInput {
  return {
    fecha_hora_evento: fechaIsoLocal(new Date()),
    latitud: 8.0931,
    longitud: -76.7285,
    precision_gps_metros: 6,
    tipo_ambiente: 'estuarino',
    condicion_organismo: 'vivo',
    observaciones_usuario: `Prueba automática del Equipo 1: ${notas}.`,
  };
}

function foto(uri: string): ImagenObservacion {
  return { uri, mimeType: 'image/jpeg', nombre: 'raya.jpg' };
}

const FINALES: EstadoObservacion[] = ['identificado', 'pendiente_experto', 'no_concluyente', 'validado', 'corregido'];

async function crearHastaFinal(notas: string, imagen: ImagenObservacion) {
  const creada = await observaciones.crearObservacion(datos(notas), imagen);
  for (let i = 0; i < 20 && !FINALES.includes((await observaciones.obtenerObservacion(creada.id)).estado); i++) {
    await new Promise((r) => setTimeout(r, 3000));
  }
  return observaciones.obtenerObservacion(creada.id);
}

async function main() {
  esperar(Boolean(E1_USUARIO_CLAVE && E1_EXPERTO_CLAVE && FOTO_RAYA_URL), 'Faltan E1_USUARIO_CLAVE, E1_EXPERTO_CLAVE o FOTO_RAYA');
  console.log(`Backend: ${API_URL}\n`);

  await caso('A01 Contraseña equivocada', async () => {
    const e = await errorDe(auth.login({ correo: USUARIO, password: 'NoEsLaClave123!' }));
    esperar(e.status === 401 || e.status === 400, `status ${e.status}`);
    return `${e.status}: "${erroresAuth(e, 'login').general}"`;
  });

  await caso('A02 Registro con correo ya usado', async () => {
    const e = await errorDe(auth.registro({ nombre_completo: 'Prueba Equipo Uno', correo: USUARIO, password: 'Clave12345!' }));
    esperar(e.status === 409, `status ${e.status}`);
    return `409: "${erroresAuth(e, 'registro').general}"`;
  });

  await caso('A03 Iniciar sesión como usuario y ver el perfil', async () => {
    const resp = await entrar(USUARIO, E1_USUARIO_CLAVE!);
    const perfil = await auth.obtenerPerfil();
    esperar(perfil.rol === 'usuario', `rol ${perfil.rol}`);
    return `rol ${perfil.rol}, token por ${resp.expires_in} s`;
  });

  await caso('A04 Renovar el token', async () => {
    const resp = await auth.refresh(tokenDeRenovacion()!);
    esperar(Boolean(resp.access_token), 'Sin access_token');
    return `nuevo token por ${resp.expires_in} s; refresh_token nuevo: ${resp.refresh_token && resp.refresh_token !== tokenDeRenovacion() ? 'sí' : 'no'}`;
  });

  await caso('A05 Catálogos', async () => {
    const [especies, familias, ambientes, condiciones] = await Promise.all([
      catalogos.obtenerEspecies(),
      catalogos.obtenerFamilias(),
      catalogos.obtenerTiposAmbiente(),
      catalogos.obtenerCondicionesOrganismo(),
    ]);
    esperar(especies.length === 4, `${especies.length} especies`);
    return `${especies.length} especies, ${familias.length} familias, ${ambientes.length} ambientes, ${condiciones.length} condiciones`;
  });

  await caso('A06 Observación válida: resultado, Registros y detalle', async () => {
    const d = await crearHastaFinal('observación válida', foto(FOTO_RAYA_URL!));
    const pagina = await observaciones.listarObservaciones();
    esperar(pagina.items.some((o) => o.id === d.id), 'No aparece en Registros');
    esperar(Boolean(d.imagen_url), 'El detalle no trae la foto');
    const especie = d.especie_aceptada?.nombre_cientifico ?? 'sin especie';
    return `estado "${d.estado}", ${especie}, confianza ${d.confianza ?? '-'}, último motivo "${d.historial_estados?.at(-1)?.motivo ?? '-'}"`;
  });

  await caso('A07 Latitud fuera de rango (sin el bloqueo del formulario)', async () => {
    const e = await errorDe(observaciones.crearObservacion({ ...datos('latitud mala'), latitud: 120 }, foto(FOTO_RAYA_URL!)));
    esperar(e.status === 400, `status ${e.status}`);
    return `400: "${mensajeError(e).replace(/\n/g, ' ')}"`;
  });

  await caso('A08 Foto de más de 10 MB', async () => {
    const e = await errorDe(observaciones.crearObservacion(datos('foto pesada'), foto(FOTO_PESADA_URL!)));
    esperar(e.status === 413 || e.status === 400, `status ${e.status}`);
    return `${e.status}: "${mensajeError(e).replace(/\n/g, ' ')}"`;
  });

  await caso('A09 Foto GIF (sin el bloqueo del formulario)', async () => {
    const e = await errorDe(observaciones.crearObservacion(datos('foto gif'), { uri: FOTO_GIF_URL!, mimeType: 'image/gif' as 'image/jpeg', nombre: 'raya.gif' }));
    esperar(e.status === 400 || e.status === 415, `status ${e.status}`);
    return `${e.status}: "${mensajeError(e).replace(/\n/g, ' ')}"`;
  });

  await caso('A10 Observador no puede ver "Por validar"', async () => {
    const e = await errorDe(observaciones.listarPendientes());
    esperar(e.status === 403, `status ${e.status}`);
    return '403';
  });

  await caso('A11 Observador no puede validar', async () => {
    const pagina = await observaciones.listarObservaciones();
    esperar(pagina.items.length > 0, 'La cuenta no tiene observaciones');
    const e = await errorDe(validacion.validarObservacion(pagina.items[0].id, { decision: 'confirmada', especie_final_codigo: null, comentario: null }));
    esperar(e.status === 403, `status ${e.status}`);
    return `403: "${erroresValidacion(e).mensaje}"`;
  });

  if (FOTO_NO_RAYA_URL) {
    await caso('A12 Foto sin raya: queda para el experto', async () => {
      const notas = `foto sin raya ${Date.now()}`;
      const e = await observaciones.crearObservacion(datos(notas), foto(FOTO_NO_RAYA_URL)).then(() => null, (err: unknown) => err);
      if (e instanceof ErrorServicio) {
        // ¿El backend la creó aunque respondió con error? Con la cola de envío eso duplica.
        const pagina = await observaciones.listarObservaciones({ tamano: 5 });
        const creadas = await Promise.all(pagina.items.map((o) => observaciones.obtenerObservacion(o.id)));
        const creada = creadas.find((d) => d.observaciones_usuario?.includes(notas));
        throw new Error(`${e.status} ${e.cuerpo.codigo}; ${creada ? `la observación sí se creó y quedó en "${creada.estado}"` : 'no se creó'}`);
      }
      return 'creada';
    });
  }

  borrarSesion();
  await caso('A13 Sin sesión: crear observación', async () => {
    const e = await errorDe(observaciones.crearObservacion(datos('sin sesión'), foto(FOTO_RAYA_URL!)));
    esperar(e.status === 401, `status ${e.status}`);
    return `401: "${mensajeError(e)}"`;
  });

  // Solo se validan observaciones creadas por estas pruebas, nunca las de otras cuentas.
  const porValidar: { id: string; conPrediccion: boolean }[] = [];
  await caso('A14 Iniciar sesión como experto y ver "Por validar"', async () => {
    const resp = await entrar(EXPERTO, E1_EXPERTO_CLAVE!);
    esperar(resp.usuario.rol === 'experto', `rol ${resp.usuario.rol}`);
    const cola = await observaciones.listarPendientes();
    for (const o of cola.items) {
      const d = await observaciones.obtenerObservacion(o.id);
      if (d.observaciones_usuario?.startsWith('Prueba automática del Equipo 1')) {
        porValidar.push({ id: d.id, conPrediccion: Boolean(d.prediccion_original) });
      }
    }
    return `rol experto; ${cola.total} en la cola, ${porValidar.length} de estas pruebas`;
  });

  const decisiones = [
    { decision: 'corregida', especie_final_codigo: 'Hypanus_guttatus' },
    { decision: 'rechazada', especie_final_codigo: null },
    { decision: 'confirmada', especie_final_codigo: null },
  ] as const;
  const validadas: string[] = [];
  for (const d of decisiones) {
    const i = porValidar.findIndex((o) => d.decision !== 'confirmada' || o.conPrediccion);
    if (i < 0) {
      resultados.push({ caso: `A15 Experto: ${d.decision}`, ok: false, detalle: 'bloqueado: no hay una observación de prueba en la cola que sirva' });
      console.log(`BLOQUEADO | A15 Experto: ${d.decision} | no hay una observación de prueba en la cola que sirva`);
      continue;
    }
    const [{ id }] = porValidar.splice(i, 1);
    await caso(`A15 Experto: ${d.decision}`, async () => {
      const r = await validacion.validarObservacion(id, { ...d, comentario: 'Prueba automática del Equipo 1.' });
      esperar(r.validacion_experta?.decision === d.decision, 'No quedó la decisión');
      const cola = await observaciones.listarPendientes();
      esperar(!cola.items.some((o) => o.id === id), 'Sigue en la cola');
      validadas.push(id);
      return `estado "${r.estado}", especie ${r.especie_aceptada?.nombre_cientifico ?? 'ninguna'}; sale de la cola`;
    });
  }

  if (validadas[0]) {
    await caso('A16 Validar una observación ya validada', async () => {
      const e = await errorDe(validacion.validarObservacion(validadas[0], { decision: 'rechazada', especie_final_codigo: null, comentario: null }));
      esperar(e.status === 409, `status ${e.status}`);
      return `409: "${erroresValidacion(e).mensaje}"`;
    });
  }

  await caso('A17 Validar una observación que no existe', async () => {
    const e = await errorDe(validacion.validarObservacion('00000000-0000-4000-8000-000000000000', { decision: 'confirmada', especie_final_codigo: null, comentario: null }));
    esperar(e.status === 404, `status ${e.status}`);
    return `404: "${erroresValidacion(e).mensaje}"`;
  });

  const fallidos = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length - fallidos} de ${resultados.length} casos aprobados.`);
  if (fallidos > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Error durante la prueba:', e);
  process.exit(1);
});
