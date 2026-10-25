/** Error explícito de los esqueletos API mientras no haya integración (H2). */
export function noIntegrada(endpoint: string): Error {
  return new Error(
    `[IdentiMar] ${endpoint} aún no está integrado. Usa EXPO_PUBLIC_USE_API=false.`
  );
}
