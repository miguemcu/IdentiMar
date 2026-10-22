import { Button, Card, EstadoBadge, ScreenHeader } from '@/components/ui';
import {
    formatearConfianza,
    formatearCoordenadas,
    formatearFechaEvento,
} from '@/constants/formato';
import { useAuth } from '@/contexts/auth-context';
import {
    catalogosService,
    mensajeError,
    MODO_SIMULADO,
    observacionesService,
    validacionService,
} from '@/services';
import type { DecisionValidacion, ObservacionDetalle } from '@/types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, View } from 'react-native';

const ETIQUETA_DECISION: Record<DecisionValidacion, string> = {
  confirmada: 'Confirmada por el experto',
  corregida: 'Corregida por el experto',
  rechazada: 'Rechazada: no se puede identificar',
};

type Estado = 'cargando' | 'listo' | 'error';

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="py-2 border-b border-slate-light/20">
      <Text className="font-nunito-bold text-xs text-slate-mid">{etiqueta}</Text>
      <Text className="font-source text-base text-slate-deep mt-0.5">{valor}</Text>
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card>
      <Text className="font-nunito-bold text-base text-slate-deep mb-2">{titulo}</Text>
      {children}
    </Card>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <Text className="font-source text-sm text-slate-mid">{texto}</Text>;
}

export default function DetalleRegistroScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [obs, setObs] = useState<ObservacionDetalle | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');
  const { rol } = useAuth();
  const [simulando, setSimulando] = useState(false);
  const [errorSimulacion, setErrorSimulacion] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    // Al recargar un registro ya visible no se vuelve a mostrar el indicador.
    setEstado((actual) => (actual === 'listo' ? actual : 'cargando'));
    try {
      const detalle = await observacionesService.obtenerObservacion(id);
      setObs(detalle);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, [id]);

  // Se consulta de nuevo cada vez que la pantalla vuelve a estar visible, para
  // que una validación hecha después aparezca sin reiniciar la app.
  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => {
        void cargar();
      });
    }, [cargar]),
  );

  const volver = () => router.back();

  // Solo con datos simulados: reemplaza al experto que, con la API real, decide
  // desde el backend (POST /observaciones/{id}/validacion). La app no valida.
  const puedeSimularExperto =
    MODO_SIMULADO &&
    (rol === 'experto' || rol === 'administrador') &&
    !obs?.validacion_experta &&
    (obs?.estado === 'pendiente_experto' || obs?.estado === 'no_concluyente');

  async function simularDecision(decision: DecisionValidacion) {
    if (!obs) return;
    setSimulando(true);
    setErrorSimulacion(null);
    try {
      const propuesta = obs.prediccion_original?.especie_propuesta.codigo ?? null;
      let especieFinal: string | null = null;
      if (decision === 'confirmada') {
        especieFinal = propuesta;
      } else if (decision === 'corregida') {
        const especies = await catalogosService.obtenerEspecies();
        especieFinal = especies.find((e) => e.codigo !== propuesta)?.codigo ?? null;
      }
      const actualizada = await validacionService.validarObservacion(obs.id, {
        decision,
        especie_final_codigo: especieFinal,
        comentario: 'Decisión simulada desde la app (modo de prueba).',
      });
      setObs(actualizada);
    } catch (error) {
      setErrorSimulacion(mensajeError(error));
    } finally {
      setSimulando(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Detalle del registro" onBack={volver} />

      {estado === 'cargando' ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : null}

      {estado === 'error' ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            No pudimos cargar este registro
          </Text>
          <Text className="font-source text-sm text-slate-mid text-center mt-2">
            Revisa tu conexión e inténtalo de nuevo.
          </Text>
          <View className="w-full mt-5">
            <Button title="Reintentar" variant="primary" onPress={cargar} />
          </View>
        </View>
      ) : null}

      {estado === 'listo' && obs ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {obs.imagen_url ? (
            <Image
              source={{ uri: obs.imagen_url }}
              className="w-full h-56 rounded-2xl bg-slate-light/20"
              resizeMode="cover"
            />
          ) : null}

          <Card>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <Text className="font-nunito-bold text-lg text-slate-deep">
                  {obs.especie_aceptada?.nombre_comun ??
                    obs.especie_aceptada?.nombre_cientifico ??
                    'Sin especie asignada'}
                </Text>
                {obs.especie_aceptada?.nombre_cientifico && obs.especie_aceptada?.nombre_comun ? (
                  <Text className="font-source text-sm italic text-slate-mid">
                    {obs.especie_aceptada.nombre_cientifico}
                  </Text>
                ) : null}
              </View>
              <EstadoBadge estado={obs.estado} />
            </View>
          </Card>

          <Seccion titulo="Datos del registro">
            {obs.fecha_hora_evento ? (
              <Fila etiqueta="Fecha del evento" valor={formatearFechaEvento(obs.fecha_hora_evento)} />
            ) : null}
            <Fila
              etiqueta="Ubicación"
              valor={
                obs.latitud !== undefined && obs.longitud !== undefined
                  ? formatearCoordenadas(obs.latitud, obs.longitud)
                  : 'No disponible'
              }
            />
            <Fila
              etiqueta="Precisión del GPS"
              valor={
                obs.precision_gps_metros !== null && obs.precision_gps_metros !== undefined
                  ? `± ${obs.precision_gps_metros.toFixed(1)} m`
                  : 'No registrada'
              }
            />
            <Fila
              etiqueta="Tipo de ambiente"
              valor={obs.tipo_ambiente?.nombre_visible ?? 'No registrado'}
            />
            <Fila
              etiqueta="Condición del organismo"
              valor={obs.condicion_organismo?.nombre_visible ?? 'No registrada'}
            />
          </Seccion>

          {obs.observaciones_usuario ? (
            <Seccion titulo="Observaciones">
              <Text className="font-source text-base text-slate-deep">
                {obs.observaciones_usuario}
              </Text>
            </Seccion>
          ) : null}

          <Seccion titulo="Predicción del modelo">
            {obs.prediccion_original ? (
              <>
                <Fila
                  etiqueta="Especie propuesta"
                  valor={
                    obs.prediccion_original.especie_propuesta.nombre_comun ??
                    obs.prediccion_original.especie_propuesta.nombre_cientifico
                  }
                />
                <Fila
                  etiqueta="Confianza"
                  valor={formatearConfianza(obs.prediccion_original.confianza) ?? 'No disponible'}
                />
                <Fila
                  etiqueta="Versión del modelo"
                  valor={obs.prediccion_original.version_modelo}
                />
                <Text className="font-source text-xs text-slate-mid mt-2">
                  Esta predicción se conserva aunque un experto la corrija.
                </Text>
              </>
            ) : (
              <Vacio texto="Aún no hay una predicción del modelo para este registro." />
            )}
          </Seccion>

          <Seccion titulo="Validación experta">
            {obs.validacion_experta ? (
              <>
                <Fila
                  etiqueta="Decisión"
                  valor={ETIQUETA_DECISION[obs.validacion_experta.decision]}
                />
                {obs.validacion_experta.especie_final ? (
                  <Fila
                    etiqueta="Especie final"
                    valor={
                      obs.validacion_experta.especie_final.nombre_comun ??
                      obs.validacion_experta.especie_final.nombre_cientifico
                    }
                  />
                ) : null}
                {obs.validacion_experta.comentario ? (
                  <Fila etiqueta="Comentario" valor={obs.validacion_experta.comentario} />
                ) : null}
                <Fila etiqueta="Experto" valor={obs.validacion_experta.experto.nombre_completo} />
                <Fila
                  etiqueta="Fecha de validación"
                  valor={formatearFechaEvento(obs.validacion_experta.creado_en)}
                />
              </>
            ) : (
              <Vacio texto="Esta observación aún no tiene validación experta." />
            )}
          </Seccion>

          {puedeSimularExperto ? (
            <Card className="border border-ocre-dark/40 bg-ocre/10">
              <Text className="font-nunito-bold text-base text-slate-deep">
                Simular decisión del experto
              </Text>
              <Text className="font-source text-sm text-slate-mid mt-1">
                Solo en modo de prueba. Con el servidor real, el experto decide
                desde el sistema del proyecto.
              </Text>
              {errorSimulacion ? (
                <Text className="font-source text-sm text-danger mt-2">
                  {errorSimulacion}
                </Text>
              ) : null}
              <Button
                title="Confirmar especie"
                loading={simulando}
                onPress={() => void simularDecision('confirmada')}
                className="mt-3"
              />
              <Button
                title="Corregir especie"
                variant="outline"
                disabled={simulando}
                onPress={() => void simularDecision('corregida')}
                className="mt-2"
              />
              <Button
                title="No se puede identificar"
                variant="outline"
                disabled={simulando}
                onPress={() => void simularDecision('rechazada')}
                className="mt-2"
              />
            </Card>
          ) : null}

          <Seccion titulo="Historial de estados">
            {obs.historial_estados && obs.historial_estados.length > 0 ? (
              obs.historial_estados.map((transicion, indice) => (
                <View
                  key={`${transicion.creado_en}-${indice}`}
                  className="py-2 border-b border-slate-light/20"
                >
                  <EstadoBadge estado={transicion.estado_nuevo} size="sm" />
                  {transicion.motivo ? (
                    <Text className="font-source text-sm text-slate-deep mt-1">
                      {transicion.motivo}
                    </Text>
                  ) : null}
                  <Text className="font-source text-xs text-slate-mid mt-0.5">
                    {transicion.actor ?? 'Sistema'} · {formatearFechaEvento(transicion.creado_en)}
                  </Text>
                </View>
              ))
            ) : (
              <Vacio texto="Sin historial disponible." />
            )}
          </Seccion>
        </ScrollView>
      ) : null}
    </View>
  );
}