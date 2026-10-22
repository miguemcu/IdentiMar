import { Text, View } from 'react-native';

export interface AvatarProps {
  nombre: string;
  /** "azul": sobre la franja del HeroHeader. "claro": sobre fondo blanco. */
  variante?: 'azul' | 'claro';
}

/** Hasta dos iniciales del nombre: "Ana María Torres" -> "AM". */
function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ nombre, variante = 'azul' }: AvatarProps) {
  const azul = variante === 'azul';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`h-16 w-16 items-center justify-center rounded-2xl ${
        azul ? 'bg-white/20' : 'bg-ocean/15'
      }`}
    >
      <Text
        className={`font-nunito-extrabold text-2xl ${
          azul ? 'text-white' : 'text-ocean-dark'
        }`}
      >
        {iniciales(nombre)}
      </Text>
    </View>
  );
}
