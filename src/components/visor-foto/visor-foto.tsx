import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  useExclusiveGestures,
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

  const escala = useSharedValue(1);
  const escalaGuardada = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const xGuardada = useSharedValue(0);
  const yGuardada = useSharedValue(0);
  const ancho = useSharedValue(0);
  const alto = useSharedValue(0);

  // Lo que la foto ampliada sobresale del área a cada lado: no se arrastra más allá.
  const limitar = (valor: number, tamano: number, escalaActual: number) => {
    'worklet';
    const limite = (tamano * (escalaActual - 1)) / 2;
    return Math.min(Math.max(valor, -limite), limite);
  };

  const pellizco = usePinchGesture({
    onUpdate: (evento) => {
      'worklet';
      const nueva = Math.min(Math.max(escalaGuardada.get() * evento.scale, 1), ESCALA_MAXIMA);
      escala.set(nueva);
      // Al alejar, el desplazamiento se acomoda para no dejar bordes vacíos.
      x.set(limitar(xGuardada.get(), ancho.get(), nueva));
      y.set(limitar(yGuardada.get(), alto.get(), nueva));
    },
    onDeactivate: () => {
      'worklet';
      escalaGuardada.set(escala.get());
      xGuardada.set(x.get());
      yGuardada.set(y.get());
    },
  });

  const arrastre = usePanGesture({
    onUpdate: (evento) => {
      'worklet';
      const actual = escala.get();
      x.set(limitar(xGuardada.get() + evento.translationX, ancho.get(), actual));
      y.set(limitar(yGuardada.get() + evento.translationY, alto.get(), actual));
    },
    onDeactivate: () => {
      'worklet';
      xGuardada.set(x.get());
      yGuardada.set(y.get());
    },
  });

  const dobleToque = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      'worklet';
      const nueva = escalaGuardada.get() > 1 ? 1 : ESCALA_DOBLE_TOQUE;
      escala.set(withTiming(nueva));
      escalaGuardada.set(nueva);
      x.set(withTiming(0));
      y.set(withTiming(0));
      xGuardada.set(0);
      yGuardada.set(0);
    },
  });

  const pellizcoYArrastre = useSimultaneousGestures(pellizco, arrastre);
  const gestos = useExclusiveGestures(dobleToque, pellizcoYArrastre);

  const estiloFoto = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: escala.get() }],
  }));

  function reiniciar() {
    escala.set(1);
    escalaGuardada.set(1);
    x.set(0);
    y.set(0);
    xGuardada.set(0);
    yGuardada.set(0);
    setAviso(null);
  }

  function medir(evento: LayoutChangeEvent) {
    ancho.set(evento.nativeEvent.layout.width);
    alto.set(evento.nativeEvent.layout.height);
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

          <View className="flex-1 overflow-hidden" onLayout={medir}>
            {uri ? (
              <GestureDetector gesture={gestos}>
                <Animated.View className="flex-1" style={estiloFoto}>
                  <Image
                    source={{ uri }}
                    resizeMode="contain"
                    className="h-full w-full"
                    onError={onFallo}
                    accessibilityLabel={titulo}
                  />
                </Animated.View>
              </GestureDetector>
            ) : null}
          </View>

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
