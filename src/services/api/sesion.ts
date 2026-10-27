import * as SecureStore from 'expo-secure-store';
import type { LoginResponse, UsuarioPublico } from '../../types';
import { USE_API } from './config';

/** Sesión guardada: los tokens de LoginResponse y el usuario que los obtuvo. */
export interface SesionGuardada {
  access_token: string;
  refresh_token: string;
  /** Segundos de vigencia del access token, tal como los entrega el servidor. */
  expires_in: number;
  usuario: UsuarioPublico;
}

const CLAVE = 'identimar.sesion';

/**
 * Copia en memoria de la sesión, para que el cliente HTTP lea el token sin
 * pasar por React. Solo con la API se guarda además en el teléfono (cifrada
 * con expo-secure-store); con datos simulados la sesión dura lo que la app.
 */
let actual: SesionGuardada | null = null;

export function tokenDeAcceso(): string | null {
  return actual?.access_token ?? null;
}

export function tokenDeRenovacion(): string | null {
  return actual?.refresh_token ?? null;
}

export function usuarioDeSesion(): UsuarioPublico | null {
  return actual?.usuario ?? null;
}

function persistir(): void {
  if (!USE_API) return;
  const tarea = actual
    ? SecureStore.setItemAsync(CLAVE, JSON.stringify(actual))
    : SecureStore.deleteItemAsync(CLAVE);
  // Si el teléfono no deja guardar, la sesión sigue en memoria.
  tarea.catch(() => undefined);
}

export function guardarSesion(resp: LoginResponse): void {
  actual = {
    access_token: resp.access_token,
    refresh_token: resp.refresh_token,
    expires_in: resp.expires_in,
    usuario: resp.usuario,
  };
  persistir();
}

/**
 * Tras renovar con /auth/refresh. El backend solo devuelve `access_token` y
 * `expires_in`; si no trae `refresh_token` se conserva el anterior.
 */
export function actualizarTokens(nuevos: {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}): void {
  if (!actual) return;
  actual = {
    ...actual,
    access_token: nuevos.access_token,
    expires_in: nuevos.expires_in,
    refresh_token: nuevos.refresh_token ?? actual.refresh_token,
  };
  persistir();
}

/** Datos del usuario más recientes (por ejemplo, un rol nuevo desde /auth/perfil). */
export function actualizarUsuarioSesion(usuario: UsuarioPublico): void {
  if (!actual) return;
  actual = { ...actual, usuario };
  persistir();
}

/** Lee la sesión guardada en el teléfono al abrir la app (solo con la API). */
export async function leerSesionGuardada(): Promise<SesionGuardada | null> {
  if (!USE_API) return null;
  try {
    const texto = await SecureStore.getItemAsync(CLAVE);
    actual = texto ? (JSON.parse(texto) as SesionGuardada) : null;
  } catch {
    actual = null;
  }
  return actual;
}

export function borrarSesion(): void {
  actual = null;
  persistir();
}

const oyentesVencimiento = new Set<() => void>();

/** Avisa cuando la sesión venció y no se pudo renovar. Devuelve cómo dejar de escuchar. */
export function alVencerSesion(oyente: () => void): () => void {
  oyentesVencimiento.add(oyente);
  return () => {
    oyentesVencimiento.delete(oyente);
  };
}

export function avisarSesionVencida(): void {
  oyentesVencimiento.forEach((oyente) => oyente());
}
