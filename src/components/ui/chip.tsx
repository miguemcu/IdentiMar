import { Pressable, Text } from 'react-native';

export interface ChipProps {
  etiqueta: string;
  activo: boolean;
  onPress: () => void;
  /** Texto adicional para lectores de pantalla (descripción de la opción). */
  accessibilityHint?: string;
}

/** Opción seleccionable en forma de píldora (filtros y opciones de un grupo). */
export function Chip({ etiqueta, activo, onPress, accessibilityHint }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: activo }}
      accessibilityHint={accessibilityHint}
      className={`min-h-[44px] justify-center rounded-full border px-4 ${
        activo
          ? 'border-ocean bg-ocean active:bg-ocean-dark'
          : 'border-slate-light/60 bg-white active:bg-slate-light/20'
      }`}
    >
      <Text
        className={`font-source-semibold text-base ${
          activo ? 'text-white' : 'text-slate-deep'
        }`}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}
