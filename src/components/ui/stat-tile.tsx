import { Text, View } from 'react-native';

export interface StatTileProps {
  valor: number | string;
  etiqueta: string;
  /** "azul": sobre la franja del HeroHeader. "claro": sobre fondo blanco. */
  variante?: 'azul' | 'claro';
}

/** Número destacado con su etiqueta. Se usa en filas con flex-1. */
export function StatTile({ valor, etiqueta, variante = 'azul' }: StatTileProps) {
  const azul = variante === 'azul';
  return (
    <View
      accessible
      accessibilityLabel={`${valor} ${etiqueta}`}
      className={`flex-1 items-center rounded-2xl px-2 py-4 ${
        azul ? 'bg-white/10' : ''
      }`}
    >
      <Text
        className={`font-nunito-extrabold text-3xl ${
          azul ? 'text-white' : 'text-ocean'
        }`}
      >
        {valor}
      </Text>
      <Text
        numberOfLines={1}
        className={`mt-1 font-source-semibold text-sm ${
          azul ? 'text-white' : 'text-slate-mid'
        }`}
      >
        {etiqueta}
      </Text>
    </View>
  );
}
