import { Button, ScreenHeader } from '@/components/ui';
import { ObservacionCard } from '@/components/ui/observacion-card';
import { observacionesService } from '@/services';
import type { ObservacionResumen } from '@/types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

const TAMANO_PAGINA = 20;

type Estado = 'cargando' | 'listo' | 'error';

export default function RegistrosScreen() {
  const router = useRouter();

  const [items, setItems] = useState<ObservacionResumen[]>([]);
  const [pagina, setPagina] = useState(0);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [cargandoMas, setCargandoMas] = useState(false);
  // Evita pedir la misma página varias veces si onEndReached se dispara seguido
  const enCurso = useRef(false);

  const cargarInicial = useCallback(async () => {
    setEstado('cargando');
    try {
      const resp = await observacionesService.listarObservaciones({
        pagina: 1,
        tamano: TAMANO_PAGINA,
      });
      setItems(resp.items);
      setPagina(1);
      setTotal(resp.total);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void cargarInicial();
    });
  }, [cargarInicial]);

  const cargarMas = useCallback(async () => {
    if (enCurso.current || items.length >= total) return;
    enCurso.current = true;
    setCargandoMas(true);
    try {
      const siguiente = pagina + 1;
      const resp = await observacionesService.listarObservaciones({
        pagina: siguiente,
        tamano: TAMANO_PAGINA,
      });
      setItems((prev) => [...prev, ...resp.items]);
      setPagina(siguiente);
      setTotal(resp.total);
    } catch {
      // Se conserva la lista ya cargada; al desplazarse de nuevo se reintenta
    } finally {
      enCurso.current = false;
      setCargandoMas(false);
    }
  }, [items.length, total, pagina]);

  const abrirDetalle = (id: string) => {
    router.push(`/observaciones/${id}` as any);
  };

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Mis Registros"
        subtitle="Tus observaciones registradas"
      />

      {estado === 'cargando' ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" />
          <Text className="font-source text-sm text-slate-mid mt-3">
            Cargando registros…
          </Text>
        </View>
      ) : null}

      {estado === 'error' ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            No pudimos cargar tus registros
          </Text>
          <Text className="font-source text-sm text-slate-mid text-center mt-2">
            Revisa tu conexión e inténtalo de nuevo.
          </Text>
          <View className="w-full mt-5">
            <Button title="Reintentar" variant="primary" onPress={cargarInicial} />
          </View>
        </View>
      ) : null}

      {estado === 'listo' && items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            Aún no tienes registros
          </Text>
          <Text className="font-source text-sm text-slate-mid text-center mt-2">
            Cuando registres una raya, aparecerá aquí.
          </Text>
          <View className="w-full mt-5">
            <Button
              title="Nueva observación"
              variant="primary"
              onPress={() => router.push('/nueva-observacion')}
            />
          </View>
        </View>
      ) : null}

      {estado === 'listo' && items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ObservacionCard observacion={item} onPress={abrirDetalle} />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={cargarMas}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            cargandoMas ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      ) : null}
    </View>
  );
}