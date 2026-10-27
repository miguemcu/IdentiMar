import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

/** Tras este tiempo cargando se muestra el aviso. */
const ESPERA_MS = 10_000;

export const AVISO_CONSULTA =
  'Nuestro identificador está cargando. Si quieres hacer una observación ya mismo, toma la foto con la cámara de tu teléfono y luego súbela a la app desde la galería.';

export const AVISO_ENVIO =
  'Nuestro identificador está cargando. Tu observación se está enviando: no cierres la app.';

/**
 * Aviso para cuando una carga tarda: el servidor puede tardar en despertar si
 * lleva un rato sin uso. No muestra nada durante los primeros 10 segundos.
 */
export function CargaLenta({
  activo,
  mensaje = AVISO_CONSULTA,
  className = 'mx-4 mt-2',
}: {
  /** true mientras se espera la respuesta. */
  activo: boolean;
  mensaje?: string;
  className?: string;
}) {
  const [lenta, setLenta] = useState(false);

  useEffect(() => {
    if (!activo) return;
    const temporizador = setTimeout(() => setLenta(true), ESPERA_MS);
    return () => {
      clearTimeout(temporizador);
      setLenta(false);
    };
  }, [activo]);

  if (!activo || !lenta) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      className={`rounded-xl border border-ocean-light bg-card px-3 py-2 ${className}`}
    >
      <Text className="font-nunito-bold text-sm text-slate-deep">Esto está tardando un poco</Text>
      <Text className="font-source text-sm text-slate-mid">{mensaje}</Text>
    </View>
  );
}
