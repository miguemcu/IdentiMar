/**
 * Utilidad para simular latencia de red aleatoria entre min y max milisegundos.
 */
export async function simularRetardo(min = 300, max = 800): Promise<void> {
  const tiempo = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, tiempo));
}
