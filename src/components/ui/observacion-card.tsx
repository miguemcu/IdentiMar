import { formatearConfianza, formatearFechaEvento } from '@/constants/formato';
import type { ObservacionResumen } from '@/types';
import { Image, Text, View } from 'react-native';
import { Card } from './card';
import { EstadoBadge } from './estado-badge';

export interface ObservacionCardProps {
  observacion: ObservacionResumen;
  onPress: (id: string) => void;
}

export function ObservacionCard({ observacion, onPress }: ObservacionCardProps) {
  const especie = observacion.especie_aceptada;
  const nombre =
    especie?.nombre_comun ?? especie?.nombre_cientifico ?? 'Sin especie asignada';
  const mostrarCientifico = !!especie?.nombre_comun && !!especie?.nombre_cientifico;
  const confianza = formatearConfianza(observacion.confianza);
  const fecha = observacion.fecha_hora_evento
    ? formatearFechaEvento(observacion.fecha_hora_evento)
    : null;

  return (
    <Card
      onPress={() => onPress(observacion.id)}
      accessibilityLabel={`${nombre}${fecha ? `, ${fecha}` : ''}. Ver detalle`}
      className="flex-row gap-3 min-h-[44px]"
    >
      {observacion.imagen_url ? (
        <Image
          source={{ uri: observacion.imagen_url }}
          className="w-20 h-20 rounded-xl bg-slate-light/20"
          resizeMode="cover"
        />
      ) : (
        <View className="w-20 h-20 rounded-xl bg-slate-light/20 items-center justify-center">
          <Text className="font-source text-xs text-slate-mid">Sin foto</Text>
        </View>
      )}

      <View className="flex-1 justify-between">
        <View>
          <Text
            numberOfLines={1}
            className={`font-nunito-bold text-base ${
              especie ? 'text-slate-deep' : 'text-slate-mid'
            }`}
          >
            {nombre}
          </Text>
          {mostrarCientifico ? (
            <Text numberOfLines={1} className="font-source text-xs italic text-slate-mid">
              {especie?.nombre_cientifico}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <EstadoBadge estado={observacion.estado} size="sm" />
          {confianza ? (
            <Text className="font-source text-xs text-slate-mid">{confianza}</Text>
          ) : null}
        </View>

        {fecha ? (
          <Text className="font-source text-xs text-slate-mid mt-1">{fecha}</Text>
        ) : null}
      </View>
    </Card>
  );
}