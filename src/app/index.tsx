import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 items-center justify-center p-6">
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm items-center">
          <Text className="text-2xl font-bold text-slate-800 mb-2 text-center">
            IdentiMar
          </Text>
          <Text className="text-base text-slate-600 text-center leading-6">
            Registro e identificación de batoideos en el Urabá antioqueño.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
