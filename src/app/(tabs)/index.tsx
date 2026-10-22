import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ActionCard,
  Button,
  Card,
  HeroHeader,
  Icono,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { ObservacionCard } from '@/components/ui/observacion-card';
import { useResumenRegistros } from '@/hooks/use-resumen-registros';
import { catalogosService } from '@/services';
import type { Especie } from '@/types';

function saludoPorHora(hora: number): string {
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Cambia la especie del "¿Sabías esto?" una vez al día. */
function especieDelDia(especies: Especie[]): Especie | null {
  const rayas = especies.filter((e) => e.grupo === 'raya' && e.descripcion);
  if (rayas.length === 0) return null;
  const dia = Math.floor(Date.now() / 86_400_000);
  return rayas[dia % rayas.length];
}

export default function InicioScreen() {
  const router = useRouter();
  const [saludo] = useState(() => saludoPorHora(new Date().getHours()));
  const { resumen, error, recargar } = useResumenRegistros();
  const [especie, setEspecie] = useState<Especie | null>(null);

  const cargarEspecie = useCallback(async () => {
    try {
      setEspecie(especieDelDia(await catalogosService.obtenerEspecies()));
    } catch {
      // La tarjeta es opcional: si falla, simplemente no se muestra.
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void cargarEspecie();
    });
  }, [cargarEspecie]);

  const cifra = (valor: number | undefined) => valor ?? '–';
  const nuevaObservacion = () => router.push('/nueva-observacion');

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <HeroHeader antetitulo={saludo} titulo="¿Qué encontraste hoy?" conCruce>
        <View className="flex-row gap-3">
          <StatTile valor={cifra(resumen?.total)} etiqueta="Registros" />
          <StatTile
            valor={cifra(resumen?.identificadas)}
            etiqueta="Identificadas"
          />
          <StatTile valor={cifra(resumen?.enRevision)} etiqueta="En revisión" />
        </View>
      </HeroHeader>

      <ActionCard
        titulo="Nueva observación"
        subtitulo="Fotografía y registra una raya"
        icono="camara"
        onPress={nuevaObservacion}
        className="mx-4 -mt-12"
      />

      <View className="mt-8 gap-3 px-4">
        <SectionHeader
          titulo="Últimos registros"
          accion={resumen && resumen.total > 0 ? 'Ver todos' : undefined}
          onAccion={() => router.push('/(tabs)/registros' as any)}
        />

        {error ? (
          <Card>
            <Text className="font-source text-base text-slate-deep">
              No pudimos cargar tus registros.
            </Text>
            <Button
              title="Reintentar"
              variant="outline"
              onPress={() => void recargar()}
              className="mt-3"
            />
          </Card>
        ) : resumen && resumen.ultimos.length === 0 ? (
          <Card className="items-center py-6">
            <Icono nombre="camara" size={32} className="text-ocean" />
            <Text className="mt-2 text-center font-nunito-bold text-base text-slate-deep">
              Aún no tienes registros
            </Text>
            <Text className="mt-1 text-center font-source text-sm text-slate-mid">
              Tu primera observación aparecerá aquí.
            </Text>
          </Card>
        ) : (
          resumen?.ultimos.map((obs) => (
            <ObservacionCard
              key={obs.id}
              observacion={obs}
              onPress={(id) => router.push(`/observaciones/${id}` as any)}
            />
          ))
        )}
      </View>

      <View className="mt-8 px-4">
        <Card className="flex-row gap-3 border-amber-200 bg-amber-50">
          <Icono nombre="sinConexion" size={24} className="text-slate-deep" />
          <View className="flex-1">
            <Text className="font-nunito-bold text-base text-slate-deep">
              ¿Sin señal en el mar?
            </Text>
            <Text className="mt-1 font-source text-sm text-slate-deep">
              Toma la foto con la cámara de tu teléfono y súbela desde la
              galería cuando tengas conexión.
            </Text>
          </View>
        </Card>
      </View>

      {especie ? (
        <View className="mt-8 gap-3 px-4">
          <SectionHeader titulo="¿Sabías esto?" />
          <Card
            onPress={() => router.push(`/especies/${especie.id}` as any)}
            accessibilityLabel={`${especie.nombre_comun ?? especie.nombre_cientifico}. Ver ficha de la especie`}
            className="overflow-hidden p-0"
          >
            {especie.url_imagen_referencia ? (
              <Image
                source={{ uri: especie.url_imagen_referencia }}
                className="h-44 w-full bg-slate-light/20"
                resizeMode="cover"
              />
            ) : null}
            <View className="p-4">
              <View className="flex-row items-center gap-2">
                <Icono nombre="idea" size={18} className="text-ocre-dark" />
                <Text className="font-nunito-bold text-lg text-slate-deep">
                  {especie.nombre_comun ?? especie.nombre_cientifico}
                </Text>
              </View>
              {especie.nombre_comun ? (
                <Text className="font-source text-sm italic text-slate-mid">
                  {especie.nombre_cientifico}
                </Text>
              ) : null}
              <Text
                numberOfLines={3}
                className="mt-2 font-source text-base text-slate-deep"
              >
                {especie.descripcion}
              </Text>
            </View>
          </Card>
        </View>
      ) : null}
    </ScrollView>
  );
}
