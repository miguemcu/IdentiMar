import { Button, Icono, ScreenHeader } from '@/components/ui';
import { ObservacionCard } from '@/components/ui/observacion-card';
import { useAuth } from '@/contexts/auth-context';
import { ErrorServicio, observacionesService } from '@/services';
import type { ObservacionResumen } from '@/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

const TAMANO_PAGINA = 20;

type Estado = 'cargando' | 'listo' | 'error' | 'sin_permiso';

/**
 * Cola "Por validar" (GET /observaciones/pendientes). Con la API real es la
 * única forma de que el experto llegue a observaciones de otros usuarios.
 */
export default function PorValidarScreen() {
  const router = useRouter();
  const { rol, logout } = useAuth();
  const esValidador = rol === 'experto' || rol === 'administrador';

  const [items, setItems] = useState<ObservacionResumen[]>([]);
  const [pagina, setPagina] = useState(0);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [cargandoMas, setCargandoMas] = useState(false);
  // Evita pedir la misma página varias veces si onEndReached se dispara seguido
  const enCurso = useRef(false);

  /** 401 cierra la sesión; 403 es falta de permiso; lo demás, error de carga. */
  const manejarError = useCallback(
    (error: unknown) => {
      if (error instanceof ErrorServicio && error.status === 401) {
        void logout('sesion-vencida');
        return;
      }
      setEstado(
        error instanceof ErrorServicio && error.status === 403 ? 'sin_permiso' : 'error',
      );
    },
    [logout],
  );

  const cargarInicial = useCallback(async () => {
    if (!esValidador) return;
    // Al volver a la pantalla se recarga sin mostrar de nuevo el indicador.
    setEstado((actual) => (actual === 'listo' ? actual : 'cargando'));
    try {
      const resp = await observacionesService.listarPendientes({
        pagina: 1,
        tamano: TAMANO_PAGINA,
      });
      setItems(resp.items);
      setPagina(1);
      setTotal(resp.total);
      setEstado('listo');
    } catch (error) {
      manejarError(error);
    }
  }, [esValidador, manejarError]);

  // Al volver de validar una observación, la cola se actualiza.
  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => {
        void cargarInicial();
      });
    }, [cargarInicial]),
  );

  const cargarMas = useCallback(async () => {
    if (enCurso.current || items.length >= total) return;
    enCurso.current = true;
    setCargandoMas(true);
    try {
      const siguiente = pagina + 1;
      const resp = await observacionesService.listarPendientes({
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

  const sinAcceso = !esValidador || estado === 'sin_permiso';

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Por validar"
        subtitle={
          !sinAcceso && estado === 'listo'
            ? `${total} ${total === 1 ? 'observación' : 'observaciones'} esperando revisión`
            : undefined
        }
        onBack={() => router.back()}
      />

      {sinAcceso ? (
        <View className="flex-1 items-center justify-center p-6">
          <Icono nombre="verificado" size={40} className="text-ocean" />
          <Text className="font-nunito-bold text-lg text-slate-deep text-center mt-3">
            Esta sección es para expertos
          </Text>
          <Text className="font-source text-base text-slate-mid text-center mt-2">
            Para certificarte como experto, comunícate con el administrador de IdentiMar.
          </Text>
          <View className="w-full mt-5">
            <Button title="Volver" variant="outline" onPress={() => router.back()} />
          </View>
        </View>
      ) : null}

      {!sinAcceso && estado === 'cargando' ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" />
          <Text className="font-source text-sm text-slate-mid mt-3">
            Cargando observaciones…
          </Text>
        </View>
      ) : null}

      {!sinAcceso && estado === 'error' ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            No pudimos cargar las observaciones por validar
          </Text>
          <Text className="font-source text-sm text-slate-mid text-center mt-2">
            Revisa que tengas internet e inténtalo de nuevo.
          </Text>
          <View className="w-full mt-5">
            <Button title="Reintentar" variant="primary" onPress={cargarInicial} />
          </View>
        </View>
      ) : null}

      {!sinAcceso && estado === 'listo' && items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Icono nombre="verificado" size={40} className="text-ocean" />
          <Text className="font-nunito-bold text-lg text-slate-deep text-center mt-3">
            No hay observaciones por validar
          </Text>
          <Text className="font-source text-base text-slate-mid text-center mt-2">
            Cuando la app no pueda reconocer una raya, aparecerá aquí.
          </Text>
        </View>
      ) : null}

      {!sinAcceso && estado === 'listo' && items.length > 0 ? (
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
            ) : undefined
          }
        />
      ) : null}
    </View>
  );
}
