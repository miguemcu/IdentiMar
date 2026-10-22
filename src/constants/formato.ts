/**
 * Formateadores puros para mostrar datos de observaciones.
 * No dependen de Intl ni de la zona horaria del dispositivo: la fecha del
 * evento se muestra tal como la registró el usuario.
 */

const MESES_ABREV = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/**
 * Formatea latitud y longitud decimales.
 * Ejemplo: (8.7476, -76.6414) -> "8.7476° N, 76.6414° O"
 */
export function formatearCoordenadas(latitud: number, longitud: number): string {
  const ns = latitud >= 0 ? 'N' : 'S';
  const eo = longitud >= 0 ? 'E' : 'O';
  return `${Math.abs(latitud).toFixed(4)}° ${ns}, ${Math.abs(longitud).toFixed(4)}° ${eo}`;
}

/**
 * Convierte la confianza del contrato (0 a 1) a un porcentaje entero.
 * Devuelve null si no hay confianza (observaciones aún sin resultado).
 */
export function formatearConfianza(confianza: number | null | undefined): string | null {
  if (confianza === null || confianza === undefined || Number.isNaN(confianza)) {
    return null;
  }
  const pct = Math.round(Math.min(Math.max(confianza, 0), 1) * 100);
  return `${pct} %`;
}

/**
 * Formatea una fecha ISO 8601 con desfase, por ejemplo "2026-09-20T14:30:00-05:00".
 * Lee año, mes, día y hora directamente del texto, así que se respeta la hora local
 * registrada en el evento. Ejemplo: "20 sep 2026, 14:30"
 */
export function formatearFechaEvento(iso: string): string {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!coincidencia) {
    return iso;
  }
  const [, anio, mes, dia, hora, minuto] = coincidencia;
  const nombreMes = MESES_ABREV[Number(mes) - 1] ?? mes;
  return `${Number(dia)} ${nombreMes} ${anio}, ${hora}:${minuto}`;
}
/**
 * Convierte una fecha del dispositivo a ISO 8601 con su desfase local,
 * como pide `fecha_hora_evento`. Ejemplo: "2026-09-20T14:35:00-05:00"
 */
export function fechaIsoLocal(fecha: Date): string {
  const dos = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, '0');
  const desfase = -fecha.getTimezoneOffset();
  const signo = desfase >= 0 ? '+' : '-';
  return (
    `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}` +
    `T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:${dos(fecha.getSeconds())}` +
    `${signo}${dos(desfase / 60)}:${dos(desfase % 60)}`
  );
}
