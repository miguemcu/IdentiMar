import { Button, Card, ScreenHeader } from '@/components/ui';
import { catalogosService } from '@/services';
import type { Especie } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';

type Estado = 'cargando' | 'listo' | 'error' | 'no_encontrada';

export default function FichaEspecieScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [especie, setEspecie] = useState<Especie | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');

  // El contrato no tiene endpoint por especie: se busca en el catálogo completo
  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      const lista = await catalogosService.obtenerEspecies();
      const encontrada = lista.find((e) => e.id === id);
      if (encontrada) {
        setEspecie(encontrada);
        setEstado('listo');
      } else {
        setEstado('no_encontrada');
      }
    } catch {
      setEstado('error');
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void cargar();
    });
  }, [cargar]);

  const volver = () => router.back();
  const titulo = especie?.nombre_comun ?? especie?.nombre_cientifico ?? 'Ficha de especie';

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title={titulo} onBack={volver} />

      {estado === 'cargando' ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {estado === 'error' ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            No pudimos cargar la especie
          </Text>
          <Text className="font-source text-sm text-slate-mid text-center mt-2">
            Revisa tu conexión e inténtalo de nuevo.
          </Text>
          <View className="w-full mt-5">
            <Button title="Reintentar" variant="primary" onPress={cargar} />
          </View>
        </View>
      ) : null}

      {estado === 'no_encontrada' ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            Esta especie no está en el catálogo
          </Text>
        </View>
      ) : null}

      {estado === 'listo' && especie ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {especie.url_imagen_referencia ? (
            <Image
              source={{ uri: especie.url_imagen_referencia }}
              className="w-full h-56 rounded-2xl bg-slate-light/20"
              resizeMode="cover"
            />
          ) : null}

          <Card>
            <Text className="font-nunito-bold text-lg text-slate-deep">
              {especie.nombre_comun ?? especie.nombre_cientifico}
            </Text>
            <Text className="font-source text-base italic text-slate-mid mt-0.5">
              {especie.nombre_cientifico}
            </Text>
            {especie.familia ? (
              <Text className="font-source text-sm text-slate-mid mt-2">
                Familia {especie.familia.nombre_cientifico}
              </Text>
            ) : null}
          </Card>

          {especie.descripcion ? (
            <Card>
              <Text className="font-nunito-bold text-base text-slate-deep mb-2">
                Descripción
              </Text>
              <Text className="font-source text-base text-slate-deep">
                {especie.descripcion}
              </Text>
            </Card>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}