import { View, Text } from 'react-native';
import { ScreenHeader } from '@/components/ui';

export default function EspeciesScreen() {
  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Catálogo de Especies"
        subtitle="Batoideos del Urabá antioqueño"
      />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="font-nunito-bold text-slate-mid text-base text-center">
          — Pantalla en construcción —
        </Text>
        <Text className="font-source text-sm text-slate-light text-center mt-2">
          Aquí aparecerá el catálogo de rayas disponibles.
        </Text>
      </View>
    </View>
  );
}
