import { Text, View } from 'react-native';
import { Card, Chip, Icono, type NombreIcono } from '@/components/ui';
import type { CatalogoItem } from '@/types';

/** Tarjeta de un bloque del formulario con ícono y título. */
export function Bloque({
  icono,
  titulo,
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-ocean/10">
          <Icono nombre={icono} size={20} className="text-ocean-dark" />
        </View>
        <Text
          accessibilityRole="header"
          className="font-nunito-extrabold text-lg text-slate-deep"
        >
          {titulo}
        </Text>
      </View>
      {children}
    </Card>
  );
}

export function Opciones({
  opciones,
  seleccion,
  onSeleccionar,
}: {
  opciones: CatalogoItem[];
  seleccion: string | null;
  onSeleccionar: (codigo: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
      {opciones.map((opcion) => (
        <Chip
          key={opcion.id}
          etiqueta={opcion.nombre_visible}
          activo={opcion.codigo === seleccion}
          onPress={() => onSeleccionar(opcion.codigo)}
          accessibilityHint={opcion.descripcion ?? undefined}
        />
      ))}
    </View>
  );
}
