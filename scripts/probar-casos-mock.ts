// Casos de las pruebas funcionales del DoD con datos simulados (sin backend).
// Uso: npx tsx --import ./scripts/node/preparar.mjs scripts/probar-casos-mock.ts
import type * as ImagePicker from 'expo-image-picker';
import {
  authService,
  observacionesService,
  validacionService,
  ErrorServicio,
  mensajeError,
  erroresAuth,
  erroresValidacion,
} from '../src/services';
import { validateImageAsset, errorCoordenada } from '../src/constants/nueva-observacion';
import type { EstadoObservacion, ObservacionInput } from '../src/types';

process.env.EXPO_PUBLIC_USE_API = 'false';

const resultados: { caso: string; ok: boolean; detalle: string }[] = [];

async function caso(nombre: string, prueba: () => Promise<string>) {
  try {
    resultados.push({ caso: nombre, ok: true, detalle: await prueba() });
  } catch (e) {
    resultados.push({ caso: nombre, ok: false, detalle: e instanceof Error ? e.message : String(e) });
  }
}

function esperar(condicion: boolean, mensaje: string) {
  if (!condicion) throw new Error(mensaje);
}

async function errorDe(promesa: Promise<unknown>): Promise<ErrorServicio> {
  const e = await promesa.then(() => null, (err: unknown) => err);
  esperar(e instanceof ErrorServicio, 'Se esperaba un error del servicio');
  return e as ErrorServicio;
}

function conError<T>(valor: string, fn: () => Promise<T>): Promise<T> {
  process.env.EXPO_PUBLIC_MOCK_ERROR = valor;
  return fn().finally(() => {
    process.env.EXPO_PUBLIC_MOCK_ERROR = '';
  });
}

const datos: ObservacionInput = {
  fecha_hora_evento: new Date().toISOString(),
  latitud: 8.7476,
  longitud: -76.6414,
  precision_gps_metros: 3.5,
  tipo_ambiente: 'marino',
  condicion_organismo: 'vivo',
  observaciones_usuario: 'Prueba automática.',
};
const imagen = { uri: 'file:///prueba/raya.jpg', mimeType: 'image/jpeg' as const, nombre: 'raya.jpg' };

function asset(parcial: Partial<ImagePicker.ImagePickerAsset>): ImagePicker.ImagePickerAsset {
  return { uri: 'file:///prueba/raya.jpg', width: 1280, height: 960, fileSize: 500_000, mimeType: 'image/jpeg', ...parcial } as ImagePicker.ImagePickerAsset;
}

const FINALES: EstadoObservacion[] = ['identificado', 'pendiente_experto', 'no_concluyente'];

async function estadoFinal(id: string): Promise<EstadoObservacion> {
  for (let i = 0; i < 30; i++) {
    const d = await observacionesService.obtenerObservacion(id);
    if (FINALES.includes(d.estado)) return d.estado;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('La observación no llegó a un estado final');
}

async function main() {
  await caso('F01 Iniciar sesión con cada rol', async () => {
    const roles = [];
    for (const correo of ['ana.torres@ejemplo.co', 'carlos.mendoza@invemar.org.co', 'admin@identimar.udea.edu.co']) {
      roles.push((await authService.login({ correo, password: 'password123' })).usuario.rol);
    }
    esperar(roles.join() === 'usuario,experto,administrador', `Roles: ${roles.join()}`);
    return roles.join(', ');
  });

  await caso('F02 Registro con correo ya usado (409)', async () => {
    const e = await errorDe(authService.registro({ nombre_completo: 'Prueba', correo: 'ya.registrado@ejemplo.co', password: 'Clave1234' }));
    esperar(e.status === 409, `status ${e.status}`);
    return erroresAuth(e, 'registro').general;
  });

  await authService.login({ correo: 'ana.torres@ejemplo.co', password: 'password123' });

  await caso('F03 Observación válida: se crea y aparece en Registros', async () => {
    const nueva = await observacionesService.crearObservacion(datos, imagen);
    const pagina = await observacionesService.listarObservaciones();
    esperar(pagina.items.some((o) => o.id === nueva.id), 'No aparece en el listado');
    return `creada en estado "${nueva.estado}" y listada`;
  });

  await caso('F04 Latitud fuera de rango: se bloquea antes de enviar', async () => {
    const texto = errorCoordenada('latitud', '120', 120);
    esperar(texto !== undefined, 'El formulario no marcó el error');
    const e = await errorDe(observacionesService.crearObservacion({ ...datos, latitud: 120 }, imagen));
    esperar(e.status === 400, `status ${e.status}`);
    return `formulario: "${texto}"; servicio: 400`;
  });

  await caso('F05 Foto: tamaño, formato y peso', async () => {
    const chica = validateImageAsset(asset({ width: 31, height: 31 }));
    const minima = validateImageAsset(asset({ width: 32, height: 32 }));
    const gif = validateImageAsset(asset({ mimeType: 'image/gif', fileName: 'raya.gif' }));
    const pesada = validateImageAsset(asset({ fileSize: 11 * 1024 * 1024 }));
    const sinTipo = validateImageAsset(asset({ mimeType: undefined, fileName: 'raya.png' }));
    esperar(!chica.isValid && !chica.hasValidSize, '31 px debería rechazarse');
    esperar(minima.isValid, '32 px debería aceptarse');
    esperar(!gif.isValid && !gif.hasValidFormat, 'GIF debería rechazarse');
    esperar(!pesada.isValid && !pesada.hasValidWeight, '11 MB debería rechazarse');
    esperar(sinTipo.isValid, 'PNG sin tipo debería deducirse por la extensión');
    return '31 px, GIF y 11 MB rechazadas; 32 px y PNG sin tipo aceptadas';
  });

  for (const [valor, status] of [['400', 400], ['401', 401], ['413', 413], ['500', 500], ['red', 0]] as const) {
    await caso(`F06 Envío con error forzado ${valor}`, async () => {
      const e = await conError(valor, () => errorDe(observacionesService.crearObservacion(datos, imagen)));
      esperar(e.status === status, `status ${e.status}`);
      return mensajeError(e).replace(/\n/g, ' ');
    });
  }

  for (const resultado of FINALES) {
    await caso(`F07 Resultado forzado "${resultado}"`, async () => {
      process.env.EXPO_PUBLIC_MOCK_RESULTADO = resultado;
      const nueva = await observacionesService.crearObservacion(datos, imagen);
      const final = await estadoFinal(nueva.id);
      process.env.EXPO_PUBLIC_MOCK_RESULTADO = '';
      esperar(final === resultado, `quedó en ${final}`);
      return `recibido → … → ${final}`;
    });
  }

  await caso('F08 Observador no puede ver "Por validar" (403)', async () => {
    const e = await conError('403-pendientes', () => errorDe(observacionesService.listarPendientes()));
    esperar(e.status === 403, `status ${e.status}`);
    return '403';
  });

  await authService.login({ correo: 'carlos.mendoza@invemar.org.co', password: 'password123' });
  process.env.EXPO_PUBLIC_MOCK_RESULTADO = 'pendiente_experto';
  const pendientes: string[] = [];
  for (let i = 0; i < 3; i++) {
    const nueva = await observacionesService.crearObservacion(datos, imagen);
    await estadoFinal(nueva.id);
    pendientes.push(nueva.id);
  }
  process.env.EXPO_PUBLIC_MOCK_RESULTADO = '';

  await caso('F09 Las pendientes aparecen en "Por validar"', async () => {
    const cola = await observacionesService.listarPendientes();
    esperar(pendientes.every((id) => cola.items.some((o) => o.id === id)), 'Faltan pendientes en la cola');
    return `${cola.total} en la cola`;
  });

  const decisiones = [
    { decision: 'confirmada', especie_final_codigo: null },
    { decision: 'corregida', especie_final_codigo: 'Hypanus_guttatus' },
    { decision: 'rechazada', especie_final_codigo: null },
  ] as const;
  for (const [i, d] of decisiones.entries()) {
    await caso(`F10 Experto: ${d.decision}`, async () => {
      const r = await validacionService.validarObservacion(pendientes[i], { ...d, comentario: 'Prueba automática.' });
      esperar(r.validacion_experta?.decision === d.decision, 'No quedó la decisión');
      const cola = await observacionesService.listarPendientes();
      esperar(!cola.items.some((o) => o.id === pendientes[i]), 'Sigue en la cola');
      return `estado "${r.estado}", especie ${r.especie_aceptada?.nombre_cientifico ?? 'ninguna'}; sale de la cola`;
    });
  }

  for (const [valor, status] of [['403-validacion', 403], ['409-validacion', 409]] as const) {
    await caso(`F11 Validación con error ${status}`, async () => {
      const e = await conError(valor, () =>
        errorDe(validacionService.validarObservacion(pendientes[0], { decision: 'confirmada', especie_final_codigo: null, comentario: null })),
      );
      esperar(e.status === status, `status ${e.status}`);
      return erroresValidacion(e).mensaje;
    });
  }

  for (const r of resultados) console.log(`${r.ok ? 'APROBADO' : 'FALLIDO '} | ${r.caso} | ${r.detalle}`);
  const fallidos = resultados.filter((r) => !r.ok).length;
  console.log(`\n${resultados.length - fallidos} de ${resultados.length} casos aprobados.`);
  if (fallidos > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Error durante la prueba:', e);
  process.exit(1);
});
