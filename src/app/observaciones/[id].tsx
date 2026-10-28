import { Button, Card, EstadoBadge, Input, ScreenHeader } from '@/components/ui';
import {
    formatearConfianza,
    formatearCoordenadas,
    formatearFechaEvento,
} from '@/constants/formato';
import { useAuth } from '@/contexts/auth-context';
import {
    catalogosService,
    ErrorServicio,
    erroresValidacion,
    mensajeError,
    observacionesService,
    validacionService,
} from '@/services';
import type { DecisionValidacion, Especie, ObservacionDetalle } from '@/types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { CargaLenta } from '@/components/carga-lenta/carga-lenta';
import { FotoAmpliable } from '@/components/visor-foto/foto-ampliable';

const ETIQUETA_DECISION: Record<DecisionValidacion, string> = {
  confirmada: 'Confirmada por el experto',
  corregida: 'Corregida por el experto',
  rechazada: 'Rechazada: no se puede identificar',
};

type Estado = 'cargando' | 'listo' | 'error';

/** Máximo de `comentario` en ValidacionInput según el contrato. */
const MAX_COMENTARIO = 2000;

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="py-2 border-b border-slate-light/20">
      <Text className="font-nunito-bold text-sm text-slate-mid">{etiqueta}</Text>
      <Text className="font-source text-base text-slate-deep mt-0.5">{valor}</Text>
    </View>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card>
      <Text accessibilityRole="header" className="font-nunito-extrabold text-lg text-slate-deep mb-2">
        {titulo}
      </Text>
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
  const { rol, logout } = useAuth();
  // La URL de la imagen es firmada y temporal: si falla, se pide el detalle de
  // nuevo una sola vez. `intentoFoto` vuelve a montar la imagen al reintentar.
  const [fotoReintentada, setFotoReintentada] = useState(false);
  const [fotoFallo, setFotoFallo] = useState(false);
  const [intentoFoto, setIntentoFoto] = useState(0);
  const [enviandoDecision, setEnviandoDecision] = useState(false);
  const [errorDecision, setErrorDecision] = useState<string | null>(null);
  const [especiesCorreccion, setEspeciesCorreccion] = useState<Especie[] | null>(null);
  const [especieElegida, setEspecieElegida] = useState<string | null>(null);
  const [comentario, setComentario] = useState('');

  const cargar = useCallback(async () => {
    // Al recargar un registro ya visible no se vuelve a mostrar el indicador.
    setEstado((actual) => (actual === 'listo' ? actual : 'cargando'));
    try {
      const detalle = await observacionesService.obtenerObservacion(id);
      setObs(detalle);
      setEstado('listo');
    } catch (error) {
      if (error instanceof ErrorServicio && error.status === 401) {
        void logout('sesion-vencida');
        return;
      }
      setEstado('error');
    }
  }, [id, logout]);

  async function alFallarFoto() {
    if (fotoReintentada) {
      setFotoFallo(true);
      return;
    }
    setFotoReintentada(true);
    await cargar();
    // Se vuelve a montar la imagen solo cuando llega el detalle nuevo: si la
    // URL es la misma, sin esto la imagen no se recarga y no vuelve a fallar.
    setIntentoFoto((n) => n + 1);
  }

  // Al mostrar de nuevo la imagen, esta se monta y repite el ciclo completo.
  function reintentarFoto() {
    setFotoFallo(false);
    setFotoReintentada(false);
  }

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

  // El experto registra su decisión con POST /observaciones/{id}/validacion.
  const puedeValidar =
    (rol === 'experto' || rol === 'administrador') &&
    !obs?.validacion_experta &&
    (obs?.estado === 'pendiente_experto' || obs?.estado === 'no_concluyente');

  // El backend deja un rechazo del experto en `corregido` sin especie.
  const rechazada = obs?.estado === 'corregido' && !obs.especie_aceptada;

  const codigoPropuesto = obs?.prediccion_original?.especie_propuesta.codigo ?? null;

  /** Muestra las rayas del catálogo (GET /catalogos/especies) para elegir la correcta. */
  async function abrirCorreccion() {
    setErrorDecision(null);
    setEspecieElegida(null);
    try {
      const especies = await catalogosService.obtenerEspecies();
      setEspeciesCorreccion(
        especies.filter((e) => e.grupo === 'raya' && e.codigo !== codigoPropuesto),
      );
    } catch (error) {
      setErrorDecision(mensajeError(error));
    }
  }

  async function registrarDecision(
    decision: DecisionValidacion,
    especieFinal: string | null,
  ) {
    if (!obs) return;
    setEnviandoDecision(true);
    setErrorDecision(null);
    try {
      const actualizada = await validacionService.validarObservacion(obs.id, {
        decision,
        especie_final_codigo: especieFinal,
        comentario: comentario.trim() === '' ? null : comentario.trim(),
      });
      setObs(actualizada);
      setComentario('');
      setEspeciesCorreccion(null);
    } catch (error) {
      const { mensaje, recargar, sesionVencida } = erroresValidacion(error);
      if (sesionVencida) {
        void logout('sesion-vencida');
        return;
      }
      setErrorDecision(mensaje);
      // 409: se vuelve a pedir el detalle para mostrar su estado actual.
      if (recargar) void cargar();
    } finally {
      setEnviandoDecision(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Detalle del registro" onBack={volver} />

      {estado === 'cargando' ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" />
          <CargaLenta activo className="mt-4 self-stretch" />
        </View>
      ) : null}

      {estado === 'error' ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="font-nunito-bold text-base text-slate-deep text-center">
            No pudimos cargar este registro
          </Text>
          <Text className="font-source text-sm text-slate-mid text-center mt-2">
            Revisa que tengas internet e inténtalo de nuevo.
          </Text>
          <View className="w-full mt-5">
            <Button title="Reintentar" variant="primary" onPress={cargar} />
          </View>
        </View>
      ) : null}

      {estado === 'listo' && obs ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {obs.imagen_url && fotoFallo ? (
            <View className="w-full h-64 rounded-3xl bg-slate-light/20 items-center justify-center p-6">
              <Text className="font-nunito-bold text-base text-slate-deep text-center">
                No pudimos cargar la foto
              </Text>
              <Text className="font-source text-sm text-slate-mid text-center mt-1">
                Revisa que tengas internet e inténtalo de nuevo.
              </Text>
              <View className="w-full mt-4">
                <Button title="Volver a cargar la foto" variant="outline" onPress={reintentarFoto} />
              </View>
            </View>
          ) : obs.imagen_url ? (
            <FotoAmpliable
              key={`${obs.imagen_url}-${intentoFoto}`}
              uri={obs.imagen_url}
              titulo="Foto del registro"
              nombreBase={`identimar-${obs.id.slice(0, 8)}`}
              className="w-full h-64 rounded-3xl"
              onFallo={() => void alFallarFoto()}
            />
          ) : null}

          <Card>
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-2">
                <Text className="font-nunito-bold text-lg text-slate-deep">
                  {obs.especie_aceptada?.nombre_comun ??
                    obs.especie_aceptada?.nombre_cientifico ??
                    (rechazada ? 'No se pudo identificar' : 'Sin especie asignada')}
                </Text>
                {obs.especie_aceptada?.nombre_cientifico && obs.especie_aceptada?.nombre_comun ? (
                  <Text className="font-source text-sm italic text-slate-mid">
                    {obs.especie_aceptada.nombre_cientifico}
                  </Text>
                ) : null}
              </View>
              <EstadoBadge estado={obs.estado} sinEspecie={!obs.especie_aceptada} />
            </View>
            {rechazada ? (
              <Text className="mt-2 font-source text-base text-slate-mid">
                Un experto revisó esta foto, pero no pudo identificar la especie.
              </Text>
            ) : null}
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
              etiqueta="Precisión de la ubicación"
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

          <Seccion titulo="Sugerencia de la app">
            {obs.prediccion_original ? (
              <>
                <Fila
                  etiqueta="Especie sugerida"
                  valor={
                    obs.prediccion_original.especie_propuesta.nombre_comun ??
                    obs.prediccion_original.especie_propuesta.nombre_cientifico
                  }
                />
                <Fila
                  etiqueta="Qué tan segura está"
                  valor={formatearConfianza(obs.prediccion_original.confianza) ?? 'No disponible'}
                />
                <Fila
                  etiqueta="Versión de la app de identificación"
                  valor={obs.prediccion_original.version_modelo}
                />
                {obs.validacion_experta ? (
                  <Text className="font-source text-sm text-slate-mid mt-2">
                    Es lo que sugirió la app al principio. La decisión del
                    experto aparece abajo.
                  </Text>
                ) : null}
              </>
            ) : (
              <Vacio texto="La app todavía no ha sugerido una especie para este registro." />
            )}
          </Seccion>

          {/* El experto solo revisa lo que el modelo no pudo confirmar
              (pendiente_experto y no_concluyente); en identificado no aplica. */}
          {obs.validacion_experta ||
          obs.estado === 'pendiente_experto' ||
          obs.estado === 'no_concluyente' ? (
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
                <Vacio texto="Un experto revisará esta foto porque la app no pudo reconocer la especie." />
              )}
            </Seccion>
          ) : null}

          {!puedeValidar && errorDecision ? (
            <Card className="border-red-200 bg-red-50">
              <Text accessibilityLiveRegion="polite" className="font-source text-sm text-danger">
                {errorDecision}
              </Text>
            </Card>
          ) : null}

          {puedeValidar ? (
            <Card>
              <Text accessibilityRole="header" className="font-nunito-extrabold text-lg text-slate-deep">
                Tu decisión como experto
              </Text>
              <Text className="font-source text-sm text-slate-mid mt-1">
                La predicción de la app se conserva aparte; tu decisión queda como la especie final.
              </Text>
              <Input
                label="Comentario (opcional)"
                value={comentario}
                onChangeText={setComentario}
                maxLength={MAX_COMENTARIO}
                multiline
                textAlignVertical="top"
                className="min-h-[96px]"
                placeholder="Ej. Coincide con las manchas y la forma del disco"
                helperText={`${comentario.length} / ${MAX_COMENTARIO}`}
                accessibilityLabel="Comentario del experto"
                editable={!enviandoDecision}
                containerClassName="mt-3 mb-0"
              />
              {errorDecision ? (
                <Text className="font-source text-sm text-danger mt-2">
                  {errorDecision}
                </Text>
              ) : null}
              {especiesCorreccion ? (
                <>
                  <Text className="font-nunito-bold text-sm text-slate-deep mt-3 mb-2">
                    ¿Cuál es la especie correcta?
                  </Text>
                  <View accessibilityRole="radiogroup" className="gap-2">
                    {especiesCorreccion.map((especie) => {
                      const activa = especie.codigo === especieElegida;
                      return (
                        <Pressable
                          key={especie.id}
                          onPress={() => setEspecieElegida(especie.codigo)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: activa }}
                          className={`min-h-[44px] justify-center rounded-xl border px-4 py-2 ${
                            activa
                              ? 'border-ocean bg-ocean active:bg-ocean-dark'
                              : 'border-slate-light/60 bg-white active:bg-slate-light/20'
                          }`}
                        >
                          <Text
                            className={`font-source-semibold text-base ${
                              activa ? 'text-white' : 'text-slate-deep'
                            }`}
                          >
                            {especie.nombre_comun ?? especie.nombre_cientifico}
                          </Text>
                          {especie.nombre_comun ? (
                            <Text
                              className={`font-source text-sm italic ${
                                activa ? 'text-white' : 'text-slate-mid'
                              }`}
                            >
                              {especie.nombre_cientifico}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                  <Button
                    title="Guardar corrección"
                    loading={enviandoDecision}
                    disabled={!especieElegida}
                    onPress={() => void registrarDecision('corregida', especieElegida)}
                    className="mt-3"
                  />
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    disabled={enviandoDecision}
                    onPress={() => setEspeciesCorreccion(null)}
                    className="mt-2"
                  />
                </>
              ) : (
                <>
                  <Button
                    title="Confirmar especie"
                    loading={enviandoDecision}
                    disabled={!codigoPropuesto}
                    onPress={() => void registrarDecision('confirmada', codigoPropuesto)}
                    className="mt-3"
                  />
                  <Button
                    title="Corregir especie"
                    variant="outline"
                    disabled={enviandoDecision}
                    onPress={() => void abrirCorreccion()}
                    className="mt-2"
                  />
                  <Button
                    title="No se puede identificar"
                    variant="outline"
                    disabled={enviandoDecision}
                    onPress={() => void registrarDecision('rechazada', null)}
                    className="mt-2"
                  />
                </>
              )}
            </Card>
          ) : null}

          <Seccion titulo="Historial de estados">
            {obs.historial_estados && obs.historial_estados.length > 0 ? (
              obs.historial_estados.map((transicion, indice) => (
                <View
                  key={`${transicion.creado_en}-${indice}`}
                  className="py-2 border-b border-slate-light/20"
                >
                  <EstadoBadge estado={transicion.estado_nuevo} sinEspecie={rechazada} size="sm" />
                  {transicion.motivo ? (
                    <Text className="font-source text-sm text-slate-deep mt-1">
                      {transicion.motivo}
                    </Text>
                  ) : null}
                  <Text className="font-source text-sm text-slate-mid mt-0.5">
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