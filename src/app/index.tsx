import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 items-center justify-center p-6">
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-light/20 w-full max-w-sm items-center">
          <Text className="text-3xl font-nunito-bold text-slate-deep mb-2 text-center">
            IdentiMar
          </Text>
          <Text className="text-base font-source text-slate-mid text-center leading-6 mb-6">
            Registro e identificación de batoideos en el Urabá antioqueño.
          </Text>

          <Button
            title="Ver Galería de Componentes"
            variant="primary"
            className="w-full"
            onPress={() => router.push("/demo-componentes" as any)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
