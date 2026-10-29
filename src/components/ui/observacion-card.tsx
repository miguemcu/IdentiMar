import { formatearConfianza, formatearFechaEvento } from '@/constants/formato';
import { useFotoObservacion } from '@/hooks/use-foto-observacion';
import type { ObservacionResumen } from '@/types';
import { Image, Text, View } from 'react-native';
import { Card } from './card';
import { EstadoBadge } from './estado-badge';
import { Icono } from './icono';

export interface ObservacionCardProps {
  observacion: ObservacionResumen;
  onPress: (id: string) => void;
}

export function ObservacionCard({ observacion, onPress }: ObservacionCardProps) {
  const especie = observacion.especie_aceptada;
  const foto = useFotoObservacion(observacion);
  // `corregido` sin especie: el experto la rechazó.
  const nombre =
    especie?.nombre_comun ??
    especie?.nombre_cientifico ??
    (observacion.estado === 'corregido' ? 'No se pudo identificar' : 'Especie por identificar');
  const mostrarCientifico = !!especie?.nombre_comun && !!especie?.nombre_cientifico;
  // El porcentaje solo acompaña a una especie aceptada (no a "En revisión").
  const confianza = especie ? formatearConfianza(observacion.confianza) : null;
  const fecha = observacion.fecha_hora_evento
    ? formatearFechaEvento(observacion.fecha_hora_evento)
    : null;

  return (
    <Card
      onPress={() => onPress(observacion.id)}
      accessibilityLabel={`${nombre}${fecha ? `, ${fecha}` : ''}. Ver detalle`}
      className="flex-row gap-4 p-3"
    >
      {foto.url ? (
        <Image
          source={{ uri: foto.url }}
          onError={foto.alFallar}
          className="h-24 w-24 rounded-2xl bg-slate-light/20"
          resizeMode="cover"
        />
      ) : (
        <View className="h-24 w-24 items-center justify-center rounded-2xl bg-slate-light/20">
          <Icono nombre="camara" size={28} className="text-slate-mid" />
        </View>
      )}

      <View className="flex-1 justify-center">
        <Text
          numberOfLines={1}
          className={`font-nunito-bold text-lg ${
            especie ? 'text-slate-deep' : 'text-slate-mid'
          }`}
        >
          {nombre}
        </Text>
        {mostrarCientifico ? (
          <Text numberOfLines={1} className="font-source text-sm italic text-slate-mid">
            {especie?.nombre_cientifico}
          </Text>
        ) : null}

        {fecha ? (
          <View className="mt-1 flex-row items-center gap-1">
            <Icono nombre="calendario" size={14} className="text-slate-mid" />
            <Text className="font-source text-sm text-slate-mid">{fecha}</Text>
          </View>
        ) : null}

        <View className="mt-2 flex-row items-center gap-2">
          <EstadoBadge estado={observacion.estado} sinEspecie={!especie} size="sm" />
          {confianza ? (
            <Text className="font-source-semibold text-sm text-slate-deep">
              {confianza}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
