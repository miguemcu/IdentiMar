import { View, Text } from 'react-native';
import { ScreenHeader } from '@/components/ui';

export default function RegistrosScreen() {
  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Mis Registros"
        subtitle="Historial de observaciones registradas"
      />
      <View className="flex-1 items-center justify-center p-6">
        <Text className="font-nunito-bold text-slate-mid text-base text-center">
          — Pantalla en construcción —
        </Text>
        <Text className="font-source text-sm text-slate-light text-center mt-2">
          Aquí aparecerá el listado de observaciones registradas.
        </Text>
      </View>
    </View>
  );
}
