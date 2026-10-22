import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface HeroHeaderProps {
  /** Texto pequeño sobre el título, por ejemplo el saludo. */
  antetitulo?: string;
  titulo: string;
  subtitulo?: string;
  /** Elemento a la derecha del título (avatar, insignia…). */
  derecha?: React.ReactNode;
  /** Contenido dentro de la franja azul, debajo del título (estadísticas…). */
  children?: React.ReactNode;
  /**
   * Deja espacio al final para que la tarjeta siguiente "cruce" la franja azul
   * con un margen negativo (-mt-12).
   */
  conCruce?: boolean;
}

/**
 * Franja azul superior de las pantallas principales. Respeta la safe area.
 * Usa ocean-dark: el texto blanco sobre ocean no alcanza 4.5:1 de contraste.
 */
export function HeroHeader({
  antetitulo,
  titulo,
  subtitulo,
  derecha,
  children,
  conCruce = false,
}: HeroHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 16) + 8 }}
      className={`bg-ocean-dark px-4 ${conCruce ? 'pb-16' : 'pb-6'}`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          {antetitulo ? (
            <Text className="font-source-semibold text-base text-white">
              {antetitulo}
            </Text>
          ) : null}
          <Text
            accessibilityRole="header"
            className="font-nunito-extrabold text-3xl text-white"
          >
            {titulo}
          </Text>
          {subtitulo ? (
            <Text className="mt-1 font-source text-base text-white">
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {derecha}
      </View>
      {children ? <View className="mt-5">{children}</View> : null}
    </View>
  );
}
