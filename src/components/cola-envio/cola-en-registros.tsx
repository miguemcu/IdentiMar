import { Text, View } from 'react-native';
import { Button, Card } from '@/components/ui';
import { formatearFechaEvento } from '@/constants/formato';
import { useColaEnvio } from '@/contexts/cola-envio-context';

/**
 * Observaciones guardadas en el teléfono que aún no llegan al servidor. Usa
 * etiquetas propias porque no son estados del contrato.
 */
export function ColaEnRegistros() {
  const { cola, enviando, aviso, enviarPendientes, reintentar, descartar } = useColaEnvio();
  if (cola.length === 0) return null;

  const pendientes = cola.filter((e) => e.estado === 'pendiente_envio').length;

  return (
    <View className="gap-3 px-4 pt-2">
      <Card className="border-amber-200 bg-amber-50">
        <Text accessibilityRole="header" className="font-nunito-bold text-base text-slate-deep">
          Guardadas en el teléfono ({cola.length})
        </Text>
        <Text className="mt-1 font-source text-sm text-slate-mid">
          {enviando
            ? 'Enviando…'
            : pendientes > 0
              ? 'Se enviarán solas cuando vuelva la señal.'
              : 'Revisa las que no se pudieron enviar.'}
        </Text>
        {aviso && !enviando ? (
          <Text accessibilityLiveRegion="polite" className="mt-1 font-source text-sm text-danger">
            {aviso}
          </Text>
        ) : null}
        {pendientes > 0 && !enviando ? (
          <Button
            title="Enviar ahora"
            variant="outline"
            onPress={() => void enviarPendientes('manual')}
            className="mt-3"
          />
        ) : null}
      </Card>

      {cola.map((elemento) => {
        const revision = elemento.estado === 'requiere_revision';
        return (
          <Card key={elemento.idLocal}>
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 font-nunito-bold text-base text-slate-deep">
                {formatearFechaEvento(elemento.datos.fecha_hora_evento)}
              </Text>
              <View
                className={`rounded-full px-3 py-1 ${revision ? 'bg-red-100' : 'bg-amber-100'}`}
              >
                <Text className="font-source-semibold text-sm text-slate-deep">
                  {revision ? 'Requiere revisión' : 'Pendiente de envío'}
                </Text>
              </View>
            </View>
            {revision ? (
              <>
                <Text className="mt-2 font-source text-sm text-danger">{elemento.motivo}</Text>
                <View className="mt-3 flex-row gap-2">
                  <Button
                    title="Reintentar"
                    variant="outline"
                    onPress={() => reintentar(elemento.idLocal)}
                    className="flex-1"
                  />
                  <Button
                    title="Descartar"
                    variant="ghost"
                    onPress={() => descartar(elemento.idLocal)}
                    className="flex-1"
                  />
                </View>
              </>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
