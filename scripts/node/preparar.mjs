// Prepara Node para ejecutar los servicios de la app fuera del teléfono:
// reemplaza los módulos nativos de Expo por versiones de disco o memoria y
// arma el multipart como lo hace el fetch de Expo. Uso:
//   npx tsx --import ./scripts/node/preparar.mjs scripts/<prueba>.ts
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const reemplazos = {
  'expo-file-system': new URL('./expo-file-system.cjs', import.meta.url).href,
  'expo-secure-store': new URL('./expo-secure-store.cjs', import.meta.url).href,
};

registerHooks({
  resolve(especificador, contexto, siguiente) {
    const url = reemplazos[especificador];
    return url ? { url, format: 'commonjs', shortCircuit: true } : siguiente(especificador, contexto);
  },
});

globalThis.__DEV__ = false;

// FormData con la forma del de React Native (_parts + entries).
class FormDataRN {
  _parts = [];
  append(nombre, valor) {
    this._parts.push([nombre, typeof valor === 'object' ? valor : String(valor)]);
  }
  *entries() {
    yield* this._parts;
  }
}
globalThis.FormData = FormDataRN;

const fetchReal = globalThis.fetch;
const rutaConvertir = new URL('../../node_modules/expo/build/winter/fetch/convertFormData.js', import.meta.url).href;
globalThis.fetch = async (url, init = {}) => {
  if (init.body instanceof FormDataRN) {
    const { convertFormDataAsync } = await import(rutaConvertir);
    const { body, boundary } = await convertFormDataAsync(init.body);
    init = { ...init, body, headers: { ...init.headers, 'Content-Type': `multipart/form-data; boundary=${boundary}` } };
  }
  return fetchReal(url, init);
};

// Fotos para las pruebas, como URL file:// (la forma que entrega el teléfono):
// FOTO_RAYA y FOTO_NO_RAYA si se pasaron, y dos generadas aquí, una de 11 MB y
// un GIF de 1 px.
for (const nombre of ['FOTO_RAYA', 'FOTO_NO_RAYA']) {
  if (process.env[nombre]) process.env[`${nombre}_URL`] = pathToFileURL(resolve(process.env[nombre])).href;
}
const pesada = join(tmpdir(), 'identimar-11mb.jpg');
writeFileSync(pesada, Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), randomBytes(11 * 1024 * 1024)]));
process.env.FOTO_PESADA_URL = pathToFileURL(pesada).href;
const gif = join(tmpdir(), 'identimar.gif');
writeFileSync(gif, Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64'));
process.env.FOTO_GIF_URL = pathToFileURL(gif).href;
