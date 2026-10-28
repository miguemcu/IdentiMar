import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Icono } from '@/components/ui';
import { nombreFoto } from '@/services/local/compartir-foto';
import { VisorFoto } from './visor-foto';

export interface FotoAmpliableProps {
  uri: string;
  /** Lo que se lee en voz alta y el título del visor. */
  titulo: string;
  /** Base del nombre del archivo al guardar o compartir (sin extensión). */
  nombreBase: string;
  /** Tamaño y forma de la foto en la pantalla, por ejemplo "w-full h-64 rounded-3xl". */
  className: string;
  /** La foto no cargó, en la pantalla o en el visor (por ejemplo, el enlace venció). */
  onFallo?: () => void;
}

/** Foto que se abre a pantalla completa al tocarla, con zoom, guardar y compartir. */
export function FotoAmpliable({ uri, titulo, nombreBase, className, onFallo }: FotoAmpliableProps) {
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setAbierta(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={titulo}
        accessibilityHint="Abre la foto en grande para acercarla, guardarla o compartirla"
        className="active:opacity-90"
      >
        <Image
          source={{ uri }}
          className={`bg-slate-light/20 ${className}`}
          resizeMode="cover"
          onError={onFallo}
        />
        <View className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-slate-deep/70">
          <Icono nombre="ampliar" size={20} className="text-white" />
        </View>
      </Pressable>

      <VisorFoto
        uri={abierta ? uri : null}
        titulo={titulo}
        nombreArchivo={nombreFoto(uri, nombreBase)}
        onCerrar={() => setAbierta(false)}
        onFallo={() => {
          setAbierta(false);
          onFallo?.();
        }}
      />
    </>
  );
}
