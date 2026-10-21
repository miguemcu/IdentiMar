import type { Especie } from '../types';

/**
 * Normaliza texto para comparar: minúsculas, sin tildes y sin espacios sobrantes.
 * "Látigo " -> "latigo"
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Filtra especies por nombre común y científico.
 * Cada palabra de la búsqueda debe aparecer en algún nombre, en cualquier orden:
 * "chucho raya" encuentra "Raya chucho pintada".
 * Texto vacío devuelve la lista completa.
 */
export function filtrarEspecies(especies: Especie[], texto: string): Especie[] {
  const palabras = normalizarTexto(texto).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) {
    return especies;
  }

  return especies.filter((especie) => {
    const contenido = normalizarTexto(
      `${especie.nombre_comun ?? ''} ${especie.nombre_cientifico}`,
    );
    return palabras.every((palabra) => contenido.includes(palabra));
  });
}