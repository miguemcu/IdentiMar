import { Button, Chip, Icono, ScreenHeader, etiquetaEstado } from '@/components/ui';
import { ObservacionCard } from '@/components/ui/observacion-card';
import { observacionesService } from '@/services';
import type { EstadoObservacion, ObservacionResumen } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, View } from 'react-native';

const TAMANO_PAGINA = 20;

/** Filtro del parámetro `estado` de GET /observaciones; null = todos. */
const FILTROS: (EstadoObservacion | null)[] = [
  null,
  'identificado',
  'pendiente_experto',
  'no_concluyente',
  'validado',
  'corregido',
  'procesando',
  'recibido',
];

type Estado = 'cargando' | 'listo' | 'error';

export default function RegistrosScreen() {
  const router = useRouter();

  const [items, setItems] = useState<ObservacionResumen[]>([]);
  const [pagina, setPagina] = useState(0);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [cargandoMas, setCargandoMas] = useState(false);
  const [filtro, setFiltro] = useState<EstadoObservacion | null>(null);
  // Evita pedir la misma página varias veces si onEndReached se dispara seguido
  const enCurso = useRef(false);

  const cargarInicial = useCallback(async () => {
    // Al volver a la pestaña se recarga sin mostrar de nuevo el indicador.
    setEstado((actual) => (actual === 'listo' ? actual : 'cargando'));
    try {
      const resp = await observacionesService.listarObservaciones({
        estado: filtro ?? undefined,
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
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => {
        void cargarInicial();
      });
    }, [cargarInicial]),
  );

  const cambiarFiltro = (nuevo: EstadoObservacion | null) => {
    if (nuevo === filtro) return;
    setEstado('cargando');
    setFiltro(nuevo);
  };

  const cargarMas = useCallback(async () => {
    if (enCurso.current || items.length >= total) return;
    enCurso.current = true;
    setCargandoMas(true);
    try {
      const siguiente = pagina + 1;
      const resp = await observacionesService.listarObservaciones({
        estado: filtro ?? undefined,
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
  }, [items.length, total, pagina, filtro]);

  const abrirDetalle = (id: string) => {
    router.push(`/observaciones/${id}` as any);
  };

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        grande
        title="Registros"
        subtitle={
          estado === 'listo'
            ? `${total} ${total === 1 ? 'observación' : 'observaciones'}${
                filtro ? ` · ${etiquetaEstado(filtro)}` : ''
              }`
            : 'Tus observaciones'
        }
      />

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityRole="radiogroup"
          accessibilityLabel="Filtrar por estado"
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          {FILTROS.map((opcion) => (
            <Chip
              key={opcion ?? 'todos'}
              etiqueta={opcion ? etiquetaEstado(opcion) : 'Todos'}
              activo={opcion === filtro}
              onPress={() => cambiarFiltro(opcion)}
            />
          ))}
        </ScrollView>
      </View>

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
            Revisa que tengas internet e inténtalo de nuevo.
          </Text>
          <View className="w-full mt-5">
            <Button title="Reintentar" variant="primary" onPress={cargarInicial} />
          </View>
        </View>
      ) : null}

      {estado === 'listo' && items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Icono nombre="registros" size={40} className="text-ocean" />
          <Text className="font-nunito-bold text-lg text-slate-deep text-center mt-3">
            {filtro ? 'No hay registros en este estado' : 'Aún no tienes registros'}
          </Text>
          <Text className="font-source text-base text-slate-mid text-center mt-2">
            {filtro
              ? 'Prueba con otro filtro o mira todos tus registros.'
              : 'Cuando registres una raya, aparecerá aquí.'}
          </Text>
          <View className="w-full mt-5">
            {filtro ? (
              <Button
                title="Ver todos"
                variant="outline"
                onPress={() => cambiarFiltro(null)}
              />
            ) : (
              <Button
                title="Nueva observación"
                variant="primary"
                onPress={() => router.push('/nueva-observacion')}
              />
            )}
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
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
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