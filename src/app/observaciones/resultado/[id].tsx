import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Card,
  EstadoBadge,
  Icono,
  ScreenHeader,
  type NombreIcono,
} from '@/components/ui';
import { formatearConfianza } from '@/constants/formato';
import {
  estaEnCurso,
  useSeguimientoObservacion,
} from '@/hooks/use-seguimiento-observacion';
import { mensajeError } from '@/services';
import type { EstadoObservacion, ObservacionDetalle } from '@/types';

/** Ícono y fondo que acompañan al texto de cada resultado (nunca solo color). */
const ICONO_RESULTADO: Partial<
  Record<EstadoObservacion, { icono: NombreIcono; fondo: string; color: string }>
> = {
  identificado: { icono: 'verificado', fondo: 'bg-emerald-100', color: 'text-emerald-800' },
  validado: { icono: 'verificado', fondo: 'bg-emerald-100', color: 'text-emerald-800' },
  corregido: { icono: 'verificado', fondo: 'bg-sky-100', color: 'text-sky-900' },
  pendiente_experto: { icono: 'info', fondo: 'bg-amber-100', color: 'text-amber-900' },
  no_concluyente: { icono: 'camara', fondo: 'bg-orange-100', color: 'text-orange-800' },
};

const TEXTO_EN_CURSO: Partial<Record<EstadoObservacion, string>> = {
  recibido: 'Recibimos tu foto',
  procesando: 'Analizando la foto…',
};

function NombreEspecie({ obs }: { obs: ObservacionDetalle }) {
  const especie = obs.especie_aceptada;
  if (!especie) return null;
  return (
    <View className="mt-3">
      <Text className="font-nunito-bold text-xl text-slate-deep">
        {especie.nombre_comun ?? especie.nombre_cientifico}
      </Text>
      {especie.nombre_comun ? (
        <Text className="font-source text-base italic text-slate-mid">
          {especie.nombre_cientifico}
        </Text>
      ) : null}
    </View>
  );
}

function Resultado({
  obs,
  onOtraFoto,
}: {
  obs: ObservacionDetalle;
  onOtraFoto: () => void;
}) {
  switch (obs.estado) {
    case 'identificado': {
      const confianza = formatearConfianza(obs.confianza);
      return (
        <>
          <Text className="font-nunito-bold text-base text-slate-deep">
            Posible especie
          </Text>
          <NombreEspecie obs={obs} />
          {confianza ? (
            <Text className="mt-2 font-source text-base text-slate-deep">
              Qué tan segura está la app: {confianza}
            </Text>
          ) : null}
          <Text className="mt-3 font-source text-sm text-slate-mid">
            Es una sugerencia de la app, no una identificación definitiva.
          </Text>
        </>
      );
    }
    case 'validado':
    case 'corregido':
      return (
        <>
          <Text className="font-nunito-bold text-base text-slate-deep">
            Especie revisada por un experto
          </Text>
          <NombreEspecie obs={obs} />
        </>
      );
    case 'pendiente_experto':
      return (
        <>
          <Text className="font-nunito-bold text-base text-slate-deep">
            En revisión por un experto
          </Text>
          <Text className="mt-2 font-source text-base text-slate-mid">
            La app no está segura de qué raya es. Un experto revisará tu foto
            y verás su decisión en Registros.
          </Text>
        </>
      );
    case 'no_concluyente':
      return (
        <>
          <Text className="font-nunito-bold text-base text-slate-deep">
            No se pudo identificar
          </Text>
          <Text className="mt-2 font-source text-base text-slate-mid">
            La foto no fue suficiente para reconocer la especie. Intenta con
            otra foto más clara, con buena luz y el animal completo.
          </Text>
          <Button
            title="Tomar otra foto"
            onPress={onOtraFoto}
            className="mt-4 w-full"
          />
        </>
      );
    default:
      return null;
  }
}

export default function ResultadoObservacionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { observacion: obs, error, agotado, reintentar } =
    useSeguimientoObservacion(id);

  const enCurso = !obs || estaEnCurso(obs.estado);

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Resultado" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: 16 + insets.bottom,
        }}
      >
        {obs?.imagen_url ? (
          <Image
            source={{ uri: obs.imagen_url }}
            accessibilityLabel="Foto enviada"
            className="h-64 w-full rounded-3xl bg-slate-light/20"
            resizeMode="cover"
          />
        ) : null}

        <Card>
          <View className="flex-row items-center gap-3">
            {obs && ICONO_RESULTADO[obs.estado] ? (
              <View
                className={`h-12 w-12 items-center justify-center rounded-2xl ${
                  ICONO_RESULTADO[obs.estado]!.fondo
                }`}
              >
                <Icono
                  nombre={ICONO_RESULTADO[obs.estado]!.icono}
                  size={26}
                  className={ICONO_RESULTADO[obs.estado]!.color}
                />
              </View>
            ) : null}
            {obs ? <EstadoBadge estado={obs.estado} /> : null}
          </View>

          {error ? (
            <View className="mt-3">
              <Text className="font-source text-base text-danger">
                {mensajeError(error)}
              </Text>
              <Button
                title="Reintentar"
                variant="outline"
                onPress={reintentar}
                className="mt-3 w-full"
              />
            </View>
          ) : enCurso ? (
            <View className="mt-3">
              <View className="flex-row items-center gap-3">
                {agotado ? null : <ActivityIndicator />}
                <Text className="flex-1 font-nunito-bold text-base text-slate-deep">
                  {agotado
                    ? 'Está tardando más de lo normal'
                    : (obs && TEXTO_EN_CURSO[obs.estado]) ?? 'Consultando…'}
                </Text>
              </View>
              <Text className="mt-2 font-source text-sm text-slate-mid">
                {agotado
                  ? 'Puedes revisar el resultado más tarde en Registros.'
                  : 'Puede tardar unos segundos. Si sales, el resultado quedará en Registros.'}
              </Text>
              {agotado ? (
                <Button
                  title="Consultar de nuevo"
                  variant="outline"
                  onPress={reintentar}
                  className="mt-3 w-full"
                />
              ) : null}
            </View>
          ) : (
            <View className="mt-3">
              <Resultado
                obs={obs}
                onOtraFoto={() => router.replace('/nueva-observacion')}
              />
            </View>
          )}
        </Card>

        <Button
          title="Ver detalle del registro"
          variant="outline"
          onPress={() => router.replace(`/observaciones/${id}` as any)}
        />
        <Button
          title="Ir a Inicio"
          variant="ghost"
          onPress={() => router.replace('/(tabs)' as any)}
        />
      </ScrollView>
    </View>
  );
}
