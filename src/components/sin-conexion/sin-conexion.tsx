import { Text, View } from 'react-native';
import { formatearFechaEvento } from '@/constants/formato';

/**
 * Franja "Sin conexión" para pantallas que muestran datos guardados en el
 * teléfono. Sin `guardadoEn`, explica que no hay nada guardado (o `sinCopia`).
 */
export function SinConexion({
  guardadoEn,
  sinCopia = 'Aún no hay datos guardados. Conéctate una vez para verlos sin señal.',
}: {
  guardadoEn: string | null;
  sinCopia?: string;
}) {
  return (
    <View
      accessibilityRole="alert"
      className="mx-4 mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2"
    >
      <Text className="font-nunito-bold text-sm text-slate-deep">Sin conexión</Text>
      <Text className="font-source text-sm text-slate-mid">
        {guardadoEn
          ? `Mostrando lo último que guardamos (${formatearFechaEvento(guardadoEn)}).`
          : sinCopia}
      </Text>
    </View>
  );
}
