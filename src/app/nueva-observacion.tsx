import { Card, ScreenHeader } from "@/components/ui";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function NuevaObservacionScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Nueva Observación"
        subtitle="Registro de avistamiento de raya"
        onBack={() => router.back()}
      />
      <View className="flex-1 items-center justify-center p-6">
        <Card className="w-full border border-ocean/20">
          <Text className="font-nunito-bold text-slate-deep text-base mb-2">
            — Pantalla en construcción —
          </Text>
          <Text className="font-source text-sm text-slate-mid">
            Aquí se implementará el formulario de registro de observación con
            foto, ubicación GPS, tipo de ambiente y condición del organismo.
          </Text>
        </Card>
      </View>
    </View>
  );
}
