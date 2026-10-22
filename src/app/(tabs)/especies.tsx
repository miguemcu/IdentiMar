import { Button, Card, Input, ScreenHeader } from '@/components/ui';
import { filtrarEspecies } from '@/constants/busqueda-especies';
import { catalogosService } from '@/services';
import type { Especie } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';

type Estado = 'cargando' | 'listo' | 'error';

export default function EspeciesScreen() {
  const router = useRouter();

  const [especies, setEspecies] = useState<Especie[]>([]);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [texto, setTexto] = useState('');

  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      const lista = await catalogosService.obtenerEspecies();
      setEspecies(lista);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void cargar();
    });
  }, [cargar]);

  // El filtro se recalcula en la app, sin llamadas de red
  const filtradas = useMemo(() => filtrarEspecies(especies, texto), [especies, texto]);

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Catálogo de Especies"
        subtitle="Batoideos del Urabá antioqueño"
      />

      {estado === 'cargando' ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {estado === 'error' ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            No pudimos cargar el catálogo
          </Text>
          <Text className="font-source text-sm text-slate-mid text-center mt-2">
            Revisa tu conexión e inténtalo de nuevo.
          </Text>
          <View className="w-full mt-5">
            <Button title="Reintentar" variant="primary" onPress={cargar} />
          </View>
        </View>
      ) : null}

      {estado === 'listo' ? (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-3" />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View className="mb-4">
              <Input
                placeholder="Buscar especie…"
                value={texto}
                onChangeText={setTexto}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Buscar especie por nombre común o científico"
                containerClassName="mb-0"
              />
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="font-nunito-bold text-base text-slate-deep text-center">
                {texto.trim()
                  ? 'No encontramos especies con ese nombre'
                  : 'El catálogo está vacío'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card
              onPress={() => router.push(`/especies/${item.id}` as any)}
              accessibilityLabel={`${item.nombre_comun ?? item.nombre_cientifico}. Ver ficha`}
              className="flex-row gap-3"
            >
              {item.url_imagen_referencia ? (
                <Image
                  source={{ uri: item.url_imagen_referencia }}
                  className="w-20 h-20 rounded-xl bg-slate-light/20"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-20 h-20 rounded-xl bg-slate-light/20 items-center justify-center">
                  <Text className="font-source text-xs text-slate-mid">Sin imagen</Text>
                </View>
              )}

              <View className="flex-1 justify-center">
                <Text numberOfLines={1} className="font-nunito-bold text-base text-slate-deep">
                  {item.nombre_comun ?? item.nombre_cientifico}
                </Text>
                {item.nombre_comun ? (
                  <Text numberOfLines={1} className="font-source text-xs italic text-slate-mid">
                    {item.nombre_cientifico}
                  </Text>
                ) : null}
                {item.familia ? (
                  <Text className="font-source text-xs text-slate-mid mt-1">
                    Familia {item.familia.nombre_cientifico}
                  </Text>
                ) : null}
              </View>
            </Card>
          )}
        />
      ) : null}
    </View>
  );
}