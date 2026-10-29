import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  View,
  type ImageLoadEvent,
  type LayoutChangeEvent,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  useCompetingGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono, type NombreIcono } from '@/components/ui';
import {
  compartirFoto,
  guardarEnGaleria,
  type ResultadoFoto,
} from '@/services/local/compartir-foto';

const ESCALA_MAXIMA = 5;
const ESCALA_DOBLE_TOQUE = 2.5;

const AVISO_GUARDAR: Record<ResultadoFoto, string> = {
  ok: 'Guardamos la foto en tu galería.',
  'sin-permiso': 'Para guardar la foto, permite el acceso a tus fotos.',
  'no-disponible': 'No pudimos guardar la foto. Prueba con "Compartir".',
  error: 'No pudimos guardar la foto. Prueba con "Compartir".',
};

const AVISO_COMPARTIR: Record<ResultadoFoto, string | null> = {
  ok: null,
  'sin-permiso': null,
  'no-disponible': 'Este teléfono no deja compartir desde la app.',
  error: 'No pudimos preparar la foto. Revisa tu internet e inténtalo de nuevo.',
};

export interface VisorFotoProps {
  /** Foto a mostrar; null mantiene el visor cerrado. */
  uri: string | null;
  titulo: string;
  /** Nombre del archivo al guardar o compartir, con extensión. */
  nombreArchivo: string;
  onCerrar: () => void;
  /** La foto no cargó (por ejemplo, el enlace venció). */
  onFallo?: () => void;
}

/**
 * Foto a pantalla completa: pellizcar para acercar (hasta 5×), arrastrar para
 * recorrerla ampliada y doble toque para acercar o volver. Permite guardarla
 * en la galería o compartirla.
 *
 * El Modal lleva su propio GestureHandlerRootView: en Android los gestos
 * dentro de un Modal no llegan al de la raíz.
 */
export function VisorFoto({ uri, titulo, nombreArchivo, onCerrar, onFallo }: VisorFotoProps) {
  const insets = useSafeAreaInsets();
  const [accion, setAccion] = useState<'guardar' | 'compartir' | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Estado de la foto: escala y desplazamiento desde el centro del área.
  const escala = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  // Valores al empezar el pellizco y último punto entre los dedos (desde el
  // centro del área).
  const escalaInicio = useSharedValue(1);
  const xInicio = useSharedValue(0);
  const yInicio = useSharedValue(0);
  const focoX = useSharedValue(0);
  const focoY = useSharedValue(0);
  const ultimoFocoX = useSharedValue(0);
  const ultimoFocoY = useSharedValue(0);
  // Valores al empezar el arrastre (aparte: los dos gestos pueden coincidir).
  const xArrastre = useSharedValue(0);
  const yArrastre = useSharedValue(0);
  // Al levantar los dedos de un pellizco casi nunca se sueltan a la vez: el que
  // queda no debe arrastrar la foto.
  const pellizcando = useSharedValue(false);
  const finPellizco = useSharedValue(0);
  const arrastreIgnorado = useSharedValue(false);
  // Área del visor y tamaño original de la foto (para saber cuánto ocupa en pantalla).
  const ancho = useSharedValue(0);
  const alto = useSharedValue(0);
  const anchoFoto = useSharedValue(0);
  const altoFoto = useSharedValue(0);

  /**
   * Cuánto se puede desplazar la foto a cada lado con esa escala: lo que la
   * foto (ajustada al área, como `contain`) sobresale del área.
   */
  const limites = (escalaActual: number) => {
    'worklet';
    const ajuste =
      anchoFoto.get() > 0 && altoFoto.get() > 0
        ? Math.min(ancho.get() / anchoFoto.get(), alto.get() / altoFoto.get())
        : 1;
    const anchoVisible = (anchoFoto.get() > 0 ? anchoFoto.get() * ajuste : ancho.get()) * escalaActual;
    const altoVisible = (altoFoto.get() > 0 ? altoFoto.get() * ajuste : alto.get()) * escalaActual;
    return {
      x: Math.max(0, (anchoVisible - ancho.get()) / 2),
      y: Math.max(0, (altoVisible - alto.get()) / 2),
    };
  };

  /** Más allá del límite la foto se mueve con resistencia, como en la galería del teléfono. */
  const conResistencia = (valor: number, limite: number) => {
    'worklet';
    if (valor > limite) return limite + (valor - limite) * 0.3;
    if (valor < -limite) return -limite + (valor + limite) * 0.3;
    return valor;
  };

  /**
   * Al soltar, devuelve escala y desplazamiento al rango permitido, con
   * animación. Si la escala se pasó, vuelve alrededor del punto (fx, fy), para
   * que la parte de la foto que se estaba mirando no se corra.
   */
  const acomodar = (fx = 0, fy = 0) => {
    'worklet';
    const actual = escala.get();
    const destino = Math.min(Math.max(actual, 1), ESCALA_MAXIMA);
    const proporcion = destino / actual;
    const limite = limites(destino);
    const nuevaX = fx - (fx - x.get()) * proporcion;
    const nuevaY = fy - (fy - y.get()) * proporcion;
    escala.set(withTiming(destino));
    x.set(withTiming(Math.min(Math.max(nuevaX, -limite.x), limite.x)));
    y.set(withTiming(Math.min(Math.max(nuevaY, -limite.y), limite.y)));
  };

  // El punto entre los dedos se queda quieto al ampliar, y mover los dos dedos
  // desplaza la foto. Las coordenadas son del área, que no se transforma.
  const pellizco = usePinchGesture({
    onActivate: (evento) => {
      'worklet';
      pellizcando.set(true);
      escalaInicio.set(escala.get());
      xInicio.set(x.get());
      yInicio.set(y.get());
      focoX.set(evento.focalX - ancho.get() / 2);
      focoY.set(evento.focalY - alto.get() / 2);
      ultimoFocoX.set(focoX.get());
      ultimoFocoY.set(focoY.get());
    },
    onUpdate: (evento) => {
      'worklet';
      // Deja pasar un poco del mínimo y del máximo; al soltar se acomoda.
      const nueva = Math.min(Math.max(escalaInicio.get() * evento.scale, 0.8), ESCALA_MAXIMA * 1.3);
      const proporcion = nueva / escalaInicio.get();
      const fx = evento.focalX - ancho.get() / 2;
      const fy = evento.focalY - alto.get() / 2;
      escala.set(nueva);
      x.set(fx - (focoX.get() - xInicio.get()) * proporcion);
      y.set(fy - (focoY.get() - yInicio.get()) * proporcion);
      ultimoFocoX.set(fx);
      ultimoFocoY.set(fy);
    },
    onDeactivate: () => {
      'worklet';
      pellizcando.set(false);
      finPellizco.set(Date.now());
      acomodar(ultimoFocoX.get(), ultimoFocoY.get());
    },
  });

  // Un dedo: arrastra la foto. Con dos dedos lo maneja el pellizco.
  const arrastre = usePanGesture({
    maxPointers: 1,
    onActivate: () => {
      'worklet';
      // El dedo que queda al terminar un pellizco no arrastra.
      arrastreIgnorado.set(pellizcando.get() || Date.now() - finPellizco.get() < 400);
      xArrastre.set(x.get());
      yArrastre.set(y.get());
    },
    onUpdate: (evento) => {
      'worklet';
      if (arrastreIgnorado.get() || pellizcando.get()) return;
      const limite = limites(escala.get());
      x.set(conResistencia(xArrastre.get() + evento.translationX, limite.x));
      y.set(conResistencia(yArrastre.get() + evento.translationY, limite.y));
    },
    onDeactivate: () => {
      'worklet';
      if (arrastreIgnorado.get()) return;
      acomodar();
    },
  });

  // Amplía hacia el punto tocado; si ya está ampliada, vuelve al tamaño normal.
  const dobleToque = useTapGesture({
    numberOfTaps: 2,
    // Si el dedo se mueve, no es un toque: falla enseguida y deja libre el arrastre.
    maxDistance: 20,
    onActivate: (evento) => {
      'worklet';
      if (escala.get() > 1.05) {
        escala.set(withTiming(1));
        x.set(withTiming(0));
        y.set(withTiming(0));
        return;
      }
      const limite = limites(ESCALA_DOBLE_TOQUE);
      const destinoX = -(evento.x - ancho.get() / 2) * (ESCALA_DOBLE_TOQUE - 1);
      const destinoY = -(evento.y - alto.get() / 2) * (ESCALA_DOBLE_TOQUE - 1);
      escala.set(withTiming(ESCALA_DOBLE_TOQUE));
      x.set(withTiming(Math.min(Math.max(destinoX, -limite.x), limite.x)));
      y.set(withTiming(Math.min(Math.max(destinoY, -limite.y), limite.y)));
    },
  });

  // Compiten: gana el primero que se activa. Con "exclusivos", el pellizco y
  // el arrastre esperaban a que fallara el doble toque y casi nunca arrancaban.
  const pellizcoYArrastre = useSimultaneousGestures(pellizco, arrastre);
  const gestos = useCompetingGestures(pellizcoYArrastre, dobleToque);

  const estiloFoto = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: escala.get() }],
  }));

  function reiniciar() {
    escala.set(1);
    x.set(0);
    y.set(0);
    setAviso(null);
  }

  function medir(evento: LayoutChangeEvent) {
    ancho.set(evento.nativeEvent.layout.width);
    alto.set(evento.nativeEvent.layout.height);
  }

  function alCargarFoto(evento: ImageLoadEvent) {
    anchoFoto.set(evento.nativeEvent.source.width);
    altoFoto.set(evento.nativeEvent.source.height);
  }

  async function ejecutar(tipo: 'guardar' | 'compartir') {
    if (!uri || accion) return;
    setAccion(tipo);
    setAviso(null);
    try {
      if (tipo === 'guardar') {
        setAviso(AVISO_GUARDAR[await guardarEnGaleria(uri, nombreArchivo)]);
      } else {
        setAviso(AVISO_COMPARTIR[await compartirFoto(uri, nombreArchivo)]);
      }
    } finally {
      setAccion(null);
    }
  }

  return (
    <Modal
      visible={uri !== null}
      animationType="fade"
      statusBarTranslucent
      onShow={reiniciar}
      onRequestClose={onCerrar}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-slate-deep">
          <View
            className="flex-row items-center gap-2 px-4 pb-2"
            style={{ paddingTop: insets.top + 8 }}
          >
            <Text numberOfLines={1} className="flex-1 font-nunito-bold text-lg text-white">
              {titulo}
            </Text>
            <Pressable
              onPress={onCerrar}
              accessibilityRole="button"
              accessibilityLabel="Cerrar la foto"
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/15 active:bg-white/30"
            >
              <Icono nombre="cerrar" size={24} className="text-white" />
            </Pressable>
          </View>

          {/* El detector va en el área (que no se transforma): así las
              coordenadas de los dedos no cambian con el zoom. */}
          <GestureDetector gesture={gestos}>
            <View className="flex-1 overflow-hidden" onLayout={medir} collapsable={false}>
              {uri ? (
                <Animated.View className="flex-1" style={estiloFoto}>
                  <Image
                    source={{ uri }}
                    resizeMode="contain"
                    className="h-full w-full"
                    onLoad={alCargarFoto}
                    onError={onFallo}
                    accessibilityLabel={titulo}
                  />
                </Animated.View>
              ) : null}
            </View>
          </GestureDetector>

          <View className="gap-3 px-4 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
            <Text className="text-center font-source text-sm text-slate-light">
              Pellizca o toca dos veces para acercar.
            </Text>
            {aviso ? (
              <Text
                accessibilityLiveRegion="polite"
                className="text-center font-source text-base text-white"
              >
                {aviso}
              </Text>
            ) : null}
            <View className="flex-row gap-3">
              <BotonVisor
                icono="guardar"
                texto="Guardar en el teléfono"
                cargando={accion === 'guardar'}
                onPress={() => void ejecutar('guardar')}
              />
              <BotonVisor
                icono="compartir"
                texto="Compartir"
                cargando={accion === 'compartir'}
                onPress={() => void ejecutar('compartir')}
              />
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function BotonVisor({
  icono,
  texto,
  cargando,
  onPress,
}: {
  icono: NombreIcono;
  texto: string;
  cargando: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ busy: cargando }}
      className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-white/40 px-3 active:bg-white/15"
    >
      {cargando ? (
        <ActivityIndicator color="white" />
      ) : (
        <Icono nombre={icono} size={20} className="text-white" />
      )}
      <Text numberOfLines={2} className="flex-shrink text-center font-nunito-bold text-base text-white">
        {texto}
      </Text>
    </Pressable>
  );
}
