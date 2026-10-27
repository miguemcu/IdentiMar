import type * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { fechaIsoLocal } from '@/constants/formato';
import { imagenParaEnvio } from '@/constants/nueva-observacion';
import { useAuth } from '@/contexts/auth-context';
import { ErrorServicio, mensajeError, observacionesService } from '@/services';
import { liberarFotoReservada, reservarFotoParaEnvio } from '@/services/local/fotos';

/** Datos del formulario de nueva observación listos para enviar. */
export interface FormularioEnvio {
  imageAsset: ImagePicker.ImagePickerAsset | null;
  latitud: number | null;
  longitud: number | null;
  precisionGps: number | null;
  fechaEvento: Date;
  tipoAmbiente: string | null;
  condicion: string | null;
  notas: string;
}

/**
 * Envío de la nueva observación (POST /observaciones). Si sale bien, borra el
 * borrador (`alEnviar`) y abre Resultado. Un 401 lleva a inicio de sesión.
 */
export function useEnviarObservacion(alEnviar: () => void) {
  const router = useRouter();
  const { logout } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  async function enviar(f: FormularioEnvio) {
    const { imageAsset, tipoAmbiente, condicion, latitud, longitud } = f;
    if (!imageAsset || !tipoAmbiente || !condicion || latitud === null || longitud === null) {
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);
    const notasLimpias = f.notas.trim();
    const uriEnvio = reservarFotoParaEnvio(imageAsset.uri, imageAsset.fileName ?? imageAsset.uri);

    try {
      const resumen = await observacionesService.crearObservacion(
        {
          fecha_hora_evento: fechaIsoLocal(f.fechaEvento),
          latitud,
          longitud,
          precision_gps_metros: f.precisionGps,
          tipo_ambiente: tipoAmbiente,
          condicion_organismo: condicion,
          observaciones_usuario: notasLimpias === '' ? null : notasLimpias,
        },
        imagenParaEnvio({ ...imageAsset, uri: uriEnvio }),
      );
      alEnviar();
      router.replace(`/observaciones/resultado/${resumen.id}` as any);
    } catch (error) {
      liberarFotoReservada(uriEnvio);
      if (error instanceof ErrorServicio && error.status === 401) {
        Alert.alert('Sesión expirada', mensajeError(error), [
          { text: 'Iniciar sesión', onPress: () => void logout('sesion-vencida') },
        ]);
      } else {
        setErrorEnvio(mensajeError(error));
      }
    } finally {
      setEnviando(false);
    }
  }

  return { enviar, enviando, errorEnvio };
}
