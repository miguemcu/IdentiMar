import { Pressable, Text, View } from 'react-native';
import { Icono, type NombreIcono } from './icono';

export interface ActionCardProps {
  titulo: string;
  subtitulo?: string;
  icono: NombreIcono;
  onPress: () => void;
  className?: string;
}

/**
 * Acción principal destacada: tarjeta oscura con el ícono en un recuadro azul.
 * Con -mt-12 cruza la franja azul de HeroHeader (conCruce).
 */
export function ActionCard({
  titulo,
  subtitulo,
  icono,
  onPress,
  className = '',
}: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitulo ? `${titulo}. ${subtitulo}` : titulo}
      className={`flex-row items-center gap-4 overflow-hidden rounded-3xl bg-slate-deep p-4 shadow-lg active:opacity-90 ${className}`}
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-ocean">
        <Icono nombre={icono} size={28} className="text-white" />
      </View>
      <View className="flex-1">
        <Text className="font-nunito-extrabold text-lg text-white">{titulo}</Text>
        {subtitulo ? (
          <Text className="mt-0.5 font-source text-sm text-slate-light">
            {subtitulo}
          </Text>
        ) : null}
      </View>
      <Icono nombre="agregar" size={26} className="text-white" />
    </Pressable>
  );
}
