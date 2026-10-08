import { Card, ScreenHeader } from "@/components/ui";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function CertificacionScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Solicitar certificación"
        subtitle="Proceso para convertirse en experto validador"
        onBack={() => router.back()}
      />
      <View className="flex-1 items-center justify-center p-6">
        <Card className="w-full border border-ocre/40">
          <Text className="font-nunito-bold text-slate-deep text-base mb-2">
            — Pantalla en construcción —
          </Text>
          <Text className="font-source text-sm text-slate-mid">
            Aquí se implementará el flujo de solicitud de certificación como
            experto validador (pendiente de acordar endpoint con el Equipo 3).
          </Text>
        </Card>
      </View>
    </View>
  );
}
