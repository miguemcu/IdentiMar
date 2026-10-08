import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScreenHeader, Card } from '@/components/ui';

export default function NuevaObservacionScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Nueva Observación"
        subtitle="Captura de imagen"
        onBack={() => router.back()}
      />
      <View className="flex-1 items-center justify-center p-6">
        <Card className="w-full border border-ocean/20">
          {/* TODO(frente-a): reemplazar este marcador al implementar la cámara. */}
          <View className="items-center">
            <SymbolView
              name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
              size={32}
              tintColor="#1E293B"
            />
            <Text className="font-nunito-bold text-slate-deep text-base mt-3">
              Vista en desarrollo
            </Text>
            <Text className="font-source text-sm text-slate-mid mt-1 text-center">
              La cámara estará disponible pronto.
            </Text>
          </View>
        </Card>
      </View>
    </View>
  );
}
