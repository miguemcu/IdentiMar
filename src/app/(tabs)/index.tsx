import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Badge, Card, ScreenHeader, EstadoBadge } from '@/components/ui';

const ROL_ETIQUETA: Record<string, string> = {
  usuario: 'Observador',
  experto: 'Experto validador',
  administrador: 'Administrador',
};

export default function InicioScreen() {
  const router = useRouter();
  const { usuario, rol } = useAuth();

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Inicio"
        subtitle={usuario ? `Bienvenido, ${usuario.nombre_completo.split(' ')[0]}` : 'IdentiMar'}
        rightElement={
          rol ? (
            <Badge
              label={ROL_ETIQUETA[rol] ?? rol}
              variant={rol === 'experto' ? 'ocre' : rol === 'administrador' ? 'danger' : 'ocean'}
              size="sm"
            />
          ) : undefined
        }
      />

      <View className="flex-1 p-4 gap-4">
        <Card className="border border-ocean/20">
          <Text className="font-nunito-bold text-base text-slate-deep mb-1">
            IdentiMar – Urabá Antioqueño
          </Text>
          <Text className="font-source text-sm text-slate-mid">
            Registro e identificación de batoideos en colaboración con INVEMAR.
            Rol activo: <Text className="font-nunito-bold text-ocean">{ROL_ETIQUETA[rol ?? 'usuario']}</Text>.
          </Text>
        </Card>

        {/* Demo estados para visualización */}
        <Card>
          <Text className="font-nunito-bold text-sm text-slate-deep mb-2">
            Estados de observación:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(['recibido', 'procesando', 'identificado', 'no_concluyente', 'pendiente_experto', 'validado', 'corregido'] as const).map(
              (estado) => (
                <EstadoBadge key={estado} estado={estado} size="sm" />
              )
            )}
          </View>
        </Card>

        <Pressable
          onPress={() => router.push('/demo-componentes' as any)}
          className="active:opacity-80"
          accessibilityRole="button"
          accessibilityLabel="Ver galería de componentes"
        >
          <Card className="border border-ocean/25 bg-ocean/5">
            <Text className="font-nunito-bold text-ocean text-sm">
              Ver galería de identidad visual →
            </Text>
          </Card>
        </Pressable>
      </View>
    </View>
  );
}
