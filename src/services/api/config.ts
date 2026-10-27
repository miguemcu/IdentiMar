/** true: los servicios usan la API real; false: datos simulados. */
export const USE_API = process.env.EXPO_PUBLIC_USE_API === 'true';

/**
 * URL base de la API, sin barra final. Debe ser https: con http el servidor
 * responde 301 y un POST redirigido puede perderse.
 */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'https://identimar-backend.onrender.com/api/v1'
).replace(/\/+$/, '');

/**
 * Tiempo máximo de espera por respuesta. Es largo porque el servidor (Render,
 * plan gratuito) tarda en despertar si lleva un rato sin uso.
 */
export const TIEMPO_ESPERA_MS = 90_000;
