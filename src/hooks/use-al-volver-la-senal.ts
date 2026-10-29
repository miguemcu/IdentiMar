import * as Network from 'expo-network';
import { useEffect, useRef } from 'react';

/**
 * Llama a `alVolver` cuando el teléfono recupera la red, solo mientras
 * `activo` sea true (por ejemplo, mientras se muestran datos guardados).
 */
export function useAlVolverLaSenal(activo: boolean, alVolver: () => void) {
  const alVolverRef = useRef(alVolver);
  useEffect(() => {
    alVolverRef.current = alVolver;
  });

  useEffect(() => {
    if (!activo) return;
    const suscripcion = Network.addNetworkStateListener((estado) => {
      if (estado.isInternetReachable ?? estado.isConnected) alVolverRef.current();
    });
    return () => suscripcion.remove();
  }, [activo]);
}
