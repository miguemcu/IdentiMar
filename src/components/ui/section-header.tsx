import { Pressable, Text, View } from 'react-native';

export interface SectionHeaderProps {
  titulo: string;
  /** Texto del enlace a la derecha, por ejemplo "Ver todos". */
  accion?: string;
  onAccion?: () => void;
}

export function SectionHeader({ titulo, accion, onAccion }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Text
        accessibilityRole="header"
        className="font-nunito-extrabold text-xl text-slate-deep"
      >
        {titulo}
      </Text>
      {accion && onAccion ? (
        <Pressable
          onPress={onAccion}
          accessibilityRole="link"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="min-h-[44px] justify-center active:opacity-70"
        >
          <Text className="font-nunito-bold text-base text-ocean">{accion}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
