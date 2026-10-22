import { Button, Card, Icono, Input, ScreenHeader } from '@/components/ui';
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
      // La app solo trabaja con rayas (DoD).
      setEspecies(lista.filter((e) => e.grupo === 'raya'));
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
        grande
        title="Especies del Urabá"
        subtitle="Rayas del Caribe colombiano"
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
            Revisa que tengas internet e inténtalo de nuevo.
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
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
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
                leftIcon={<Icono nombre="buscar" size={20} className="text-slate-mid" />}
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
              className="flex-row items-center gap-4 p-3"
            >
              {item.url_imagen_referencia ? (
                <Image
                  source={{ uri: item.url_imagen_referencia }}
                  className="h-24 w-24 rounded-2xl bg-slate-light/20"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-2xl bg-slate-light/20">
                  <Icono nombre="especies" size={28} className="text-slate-mid" />
                </View>
              )}

              <View className="flex-1">
                <Text numberOfLines={2} className="font-nunito-bold text-lg text-slate-deep">
                  {item.nombre_comun ?? item.nombre_cientifico}
                </Text>
                {item.nombre_comun ? (
                  <Text numberOfLines={1} className="font-source text-sm italic text-slate-mid">
                    {item.nombre_cientifico}
                  </Text>
                ) : null}
                {item.familia ? (
                  <Text className="font-source text-sm text-slate-mid mt-1">
                    Familia {item.familia.nombre_cientifico}
                  </Text>
                ) : null}
              </View>
              <Icono nombre="siguiente" size={18} className="text-slate-light" />
            </Card>
          )}
        />
      ) : null}
    </View>
  );
}