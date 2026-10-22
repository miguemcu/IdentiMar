import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Input, ScreenHeader } from '@/components/ui';
import { fechaIsoLocal, formatearFechaEvento } from '@/constants/formato';
import { useAuth } from '@/contexts/auth-context';
import {
  catalogosService,
  ErrorServicio,
  mensajeError,
  observacionesService,
  type ImagenObservacion,
} from '@/services';
import type { CatalogoItem } from '@/types';

type TemporaryCoordinates = {
  latitud: number | null;
  longitud: number | null;
};

type CoordinateField = keyof TemporaryCoordinates;

const MAX_NOTAS = 2000;

const RANGO_COORDENADA: Record<CoordinateField, number> = {
  latitud: 90,
  longitud: 180,
};

function errorCoordenada(
  field: CoordinateField,
  texto: string,
  valor: number | null,
) {
  if (texto.trim() === '') return undefined;
  if (valor === null) return 'Escribe un número, por ejemplo 8.123456';
  const max = RANGO_COORDENADA[field];
  return Math.abs(valor) > max ? `Debe estar entre -${max} y ${max}` : undefined;
}

function imagenParaEnvio(asset: ImagePicker.ImagePickerAsset): ImagenObservacion {
  // validateImageAsset ya garantizó JPEG o PNG.
  const mimeType =
    asset.mimeType?.toLowerCase() === 'image/png' ? 'image/png' : 'image/jpeg';
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  return {
    uri: asset.uri,
    mimeType,
    nombre: asset.fileName ?? `observacion.${extension}`,
  };
}

function Opciones({
  titulo,
  opciones,
  seleccion,
  onSeleccionar,
}: {
  titulo: string;
  opciones: CatalogoItem[];
  seleccion: string | null;
  onSeleccionar: (codigo: string) => void;
}) {
  return (
    <View className="mt-5">
      <Text className="mb-2 font-nunito-bold text-base text-slate-deep">
        {titulo}
      </Text>
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {opciones.map((opcion) => {
          const activa = opcion.codigo === seleccion;
          return (
            <Pressable
              key={opcion.id}
              onPress={() => onSeleccionar(opcion.codigo)}
              accessibilityRole="radio"
              accessibilityState={{ checked: activa }}
              accessibilityHint={opcion.descripcion ?? undefined}
              className={`min-h-[44px] justify-center rounded-full border px-4 ${
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
                {opcion.nombre_visible}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function validateImageAsset(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase();
  const hasValidFormat =
    mimeType === 'image/jpeg' ||
    mimeType === 'image/jpg' ||
    mimeType === 'image/png';
  const hasValidSize = Math.max(asset.width, asset.height) >= 1280;

  return {
    isValid: hasValidFormat && hasValidSize,
    hasValidFormat,
    hasValidSize,
  };
}

export default function NuevaObservacionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [imageAsset, setImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<TemporaryCoordinates>({
    latitud: null,
    longitud: null,
  });
  const [coordinateInputs, setCoordinateInputs] = useState<
    Record<CoordinateField, string>
  >({ latitud: '', longitud: '' });
  const [precisionGps, setPrecisionGps] = useState<number | null>(null);
  const [imageValidationError, setImageValidationError] = useState<
    string | null
  >(null);
  const [fechaEvento, setFechaEvento] = useState(() => new Date());
  const [fechaFutura, setFechaFutura] = useState(false);
  const [modoFecha, setModoFecha] = useState<'date' | 'time' | null>(null);
  const [tiposAmbiente, setTiposAmbiente] = useState<CatalogoItem[]>([]);
  const [condiciones, setCondiciones] = useState<CatalogoItem[]>([]);
  const [errorCatalogos, setErrorCatalogos] = useState(false);
  const [tipoAmbiente, setTipoAmbiente] = useState<string | null>(null);
  const [condicion, setCondicion] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const previousAppState = useRef(AppState.currentState);

  const cargarCatalogos = useCallback(async () => {
    setErrorCatalogos(false);
    try {
      const [tipos, conds] = await Promise.all([
        catalogosService.obtenerTiposAmbiente(),
        catalogosService.obtenerCondicionesOrganismo(),
      ]);
      setTiposAmbiente(tipos);
      setCondiciones(conds);
    } catch {
      setErrorCatalogos(true);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void cargarCatalogos();
    });
  }, [cargarCatalogos]);

  const ubicacionValida =
    coordinates.latitud !== null &&
    coordinates.longitud !== null &&
    !errorCoordenada('latitud', coordinateInputs.latitud, coordinates.latitud) &&
    !errorCoordenada('longitud', coordinateInputs.longitud, coordinates.longitud);

  const faltantes = [
    !ubicacionValida && 'la ubicación',
    fechaFutura && 'una fecha válida',
    !tipoAmbiente && 'dónde estaba',
    !condicion && 'cómo estaba el animal',
  ].filter((faltante): faltante is string => typeof faltante === 'string');

  async function enviar() {
    if (
      !imageAsset ||
      !tipoAmbiente ||
      !condicion ||
      coordinates.latitud === null ||
      coordinates.longitud === null
    ) {
      return;
    }

    setEnviando(true);
    setErrorEnvio(null);
    const notasLimpias = notas.trim();

    try {
      const resumen = await observacionesService.crearObservacion(
        {
          fecha_hora_evento: fechaIsoLocal(fechaEvento),
          latitud: coordinates.latitud,
          longitud: coordinates.longitud,
          precision_gps_metros: precisionGps,
          tipo_ambiente: tipoAmbiente,
          condicion_organismo: condicion,
          observaciones_usuario: notasLimpias === '' ? null : notasLimpias,
        },
        imagenParaEnvio(imageAsset),
      );
      router.replace(`/observaciones/${resumen.id}` as any);
    } catch (error) {
      if (error instanceof ErrorServicio && error.status === 401) {
        Alert.alert('Sesión expirada', mensajeError(error), [
          { text: 'Iniciar sesión', onPress: () => void logout() },
        ]);
      } else {
        setErrorEnvio(mensajeError(error));
      }
    } finally {
      setEnviando(false);
    }
  }

  function cambiarFecha(nuevaFecha: Date) {
    // En Android el selector es un diálogo que se cierra al elegir.
    if (Platform.OS === 'android') setModoFecha(null);
    setFechaEvento(nuevaFecha);
    setFechaFutura(nuevaFecha.getTime() > Date.now());
  }

  const captureLocation = useCallback(async (requestPermission = true) => {
    setLocationPermissionDenied(false);
    setLocationError(null);
    setIsGettingLocation(true);

    try {
      const permission = requestPermission
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationPermissionDenied(true);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const nextCoordinates: TemporaryCoordinates = {
        latitud: position.coords.latitude,
        longitud: position.coords.longitude,
      };

      setCoordinates(nextCoordinates);
      setPrecisionGps(position.coords.accuracy ?? null);
      setCoordinateInputs({
        latitud: String(nextCoordinates.latitud),
        longitud: String(nextCoordinates.longitud),
      });
    } catch {
      setLocationError(
        'No pudimos obtener la ubicación. Puedes ingresar las coordenadas manualmente.',
      );
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (!imageAsset || !locationPermissionDenied) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const returnedToApp =
        previousAppState.current?.match(/inactive|background/) &&
        nextAppState === 'active';
      previousAppState.current = nextAppState;

      if (returnedToApp) {
        void captureLocation(false);
      }
    });

    return () => subscription.remove();
  }, [captureLocation, imageAsset, locationPermissionDenied]);

  function updateCoordinate(field: CoordinateField, value: string) {
    // La precisión del GPS deja de aplicar si el usuario corrige a mano.
    setPrecisionGps(null);
    setCoordinateInputs((currentInputs) => ({
      ...currentInputs,
      [field]: value,
    }));

    const numericValue = Number(value.replace(',', '.'));
    setCoordinates((currentCoordinates) => ({
      ...currentCoordinates,
      [field]:
        value.trim() !== '' && Number.isFinite(numericValue)
          ? numericValue
          : null,
    }));
  }

  function confirmImageAsset(selectedAsset: ImagePicker.ImagePickerAsset) {
    const validation = validateImageAsset(selectedAsset);
    if (!validation.isValid) {
      const failedRequirements = [];
      if (!validation.hasValidFormat) {
        failedRequirements.push('estar en formato JPEG o PNG');
      }
      if (!validation.hasValidSize) {
        failedRequirements.push(
          'ser más grande',
        );
      }
      const requirements =
        failedRequirements.length === 2
          ? `${failedRequirements[0]} y ${failedRequirements[1]}`
          : failedRequirements[0];

      setImageValidationError(
        `La foto seleccionada debe ${requirements}. Intenta de nuevo.`,
      );
      return;
    }

    setImageAsset(selectedAsset);
    setImageValidationError(null);
    void captureLocation();
  }

  async function takePhoto() {
    setImageValidationError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setCameraPermissionDenied(true);
      return;
    }

    setCameraPermissionDenied(false);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    const selectedAsset = result.canceled ? undefined : result.assets[0];
    if (selectedAsset) {
      confirmImageAsset(selectedAsset);
    }
  }

  async function chooseFromGallery() {
    setImageValidationError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    const selectedAsset = result.canceled ? undefined : result.assets[0];
    if (selectedAsset) {
      confirmImageAsset(selectedAsset);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Nueva Observación"
        subtitle="Captura de imagen"
        onBack={() => router.back()}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          paddingBottom: 24 + insets.bottom,
        }}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <Card className="w-full border border-ocean/20">
          {imageAsset ? (
            <Image
              source={{ uri: imageAsset.uri }}
              resizeMode="contain"
              accessibilityLabel="Vista previa de la foto seleccionada"
              className="mt-4 h-64 w-full"
            />
          ) : null}
          {imageAsset ? (
            <View className="mt-5">
              <Text className="font-nunito-bold text-base text-slate-deep">
                Ubicación del avistamiento
              </Text>
              {isGettingLocation ? (
                <Text
                  accessibilityRole="text"
                  className="mt-2 font-source text-sm text-slate-mid"
                >
                  Obteniendo ubicación…
                </Text>
              ) : null}
              {locationPermissionDenied ? (
                <View className="mt-2 items-center">
                  <Text className="text-center font-source text-sm text-danger">
                    No se permitió acceder a la ubicación. Puedes ingresarla
                    manualmente.
                  </Text>
                  <Button
                    title="Abrir ajustes"
                    variant="primary"
                    onPress={() => Linking.openSettings()}
                    className="mt-2 w-full"
                  />
                  <Button
                    title="Intentar obtener ubicación de nuevo"
                    variant="outline"
                    onPress={() => void captureLocation()}
                    disabled={isGettingLocation}
                    className="mt-2 w-full"
                  />
                </View>
              ) : null}
              {locationError ? (
                <Text className="mt-2 font-source text-sm text-danger">
                  {locationError}
                </Text>
              ) : null}
              {coordinates.latitud !== null &&
              coordinates.longitud !== null ? (
                <Text className="mt-2 font-source text-sm text-slate-deep">
                  Coordenadas actuales: {coordinates.latitud.toFixed(6)}°,
                  {' '}{coordinates.longitud.toFixed(6)}°
                </Text>
              ) : null}
              <Text className="mb-3 mt-2 font-source text-sm text-slate-mid">
                Puedes corregir estos valores si conoces la ubicación exacta.
              </Text>
              <Input
                label="Latitud"
                error={errorCoordenada(
                  'latitud',
                  coordinateInputs.latitud,
                  coordinates.latitud,
                )}
                value={coordinateInputs.latitud}
                onChangeText={(value) => updateCoordinate('latitud', value)}
                keyboardType="decimal-pad"
                placeholder="Ej. 8.123456"
                accessibilityLabel="Latitud del avistamiento"
              />
              <Input
                label="Longitud"
                error={errorCoordenada(
                  'longitud',
                  coordinateInputs.longitud,
                  coordinates.longitud,
                )}
                value={coordinateInputs.longitud}
                onChangeText={(value) => updateCoordinate('longitud', value)}
                keyboardType="decimal-pad"
                placeholder="Ej. -76.123456"
                accessibilityLabel="Longitud del avistamiento"
              />

              <Text className="mt-2 font-nunito-bold text-base text-slate-deep">
                Fecha y hora del avistamiento
              </Text>
              <Text
                className={`mt-1 font-source text-base ${
                  fechaFutura ? 'text-danger' : 'text-slate-deep'
                }`}
              >
                {formatearFechaEvento(fechaIsoLocal(fechaEvento))}
              </Text>
              {fechaFutura ? (
                <Text className="mt-1 font-source text-sm text-danger">
                  La fecha no puede ser posterior a este momento.
                </Text>
              ) : null}
              <View className="mt-2 flex-row gap-2">
                <Button
                  title="Cambiar fecha"
                  variant="outline"
                  size="sm"
                  onPress={() => setModoFecha('date')}
                  className="flex-1"
                />
                <Button
                  title="Cambiar hora"
                  variant="outline"
                  size="sm"
                  onPress={() => setModoFecha('time')}
                  className="flex-1"
                />
              </View>
              {modoFecha ? (
                <DateTimePicker
                  value={fechaEvento}
                  mode={modoFecha}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  locale="es-CO"
                  onValueChange={(_, nuevaFecha) => cambiarFecha(nuevaFecha)}
                  onDismiss={() => setModoFecha(null)}
                />
              ) : null}
              {modoFecha && Platform.OS === 'ios' ? (
                <Button
                  title="Listo"
                  variant="ghost"
                  onPress={() => setModoFecha(null)}
                />
              ) : null}

              {errorCatalogos ? (
                <View className="mt-5">
                  <Text className="font-source text-sm text-danger">
                    No pudimos cargar las opciones del formulario.
                  </Text>
                  <Button
                    title="Reintentar"
                    variant="outline"
                    onPress={() => void cargarCatalogos()}
                    className="mt-2 w-full"
                  />
                </View>
              ) : (
                <>
                  <Opciones
                    titulo="¿Dónde estaba?"
                    opciones={tiposAmbiente}
                    seleccion={tipoAmbiente}
                    onSeleccionar={setTipoAmbiente}
                  />
                  <Opciones
                    titulo="¿Cómo estaba el animal?"
                    opciones={condiciones}
                    seleccion={condicion}
                    onSeleccionar={setCondicion}
                  />
                </>
              )}

              <Input
                label="Notas (opcional)"
                containerClassName="mt-5"
                value={notas}
                onChangeText={setNotas}
                maxLength={MAX_NOTAS}
                multiline
                textAlignVertical="top"
                className="min-h-[96px]"
                placeholder="Ej. La vi cerca de la desembocadura del río"
                helperText={`${notas.length} / ${MAX_NOTAS}`}
                accessibilityLabel="Notas del avistamiento"
              />
            </View>
          ) : null}
          {imageValidationError ? (
            <Text className="mt-4 text-center font-source text-sm text-danger">
              {imageValidationError}
            </Text>
          ) : null}
          <Button
            title={
              imageValidationError
                ? 'Intentar de nuevo con la cámara'
                : imageAsset
                  ? 'Cambiar foto con la cámara'
                  : 'Tomar foto'
            }
            onPress={takePhoto}
            className="w-full"
          />
          <Button
            title={
              imageValidationError
                ? 'Intentar de nuevo desde la galería'
                : imageAsset
                  ? 'Cambiar foto desde la galería'
                  : 'Elegir de la galería'
            }
            variant="outline"
            onPress={chooseFromGallery}
            className="mt-3 w-full"
          />
          {cameraPermissionDenied ? (
            <View className="mt-4 items-center">
              <Text className="font-source text-sm text-danger text-center">
                Necesitamos acceso a la cámara para tomar la foto
              </Text>
              <Button
                title="Abrir ajustes"
                variant="ghost"
                onPress={() => Linking.openSettings()}
                className="mt-2 w-full"
              />
            </View>
          ) : null}
        </Card>
        {imageAsset ? (
          <View className="mt-4 w-full">
            {faltantes.length > 0 ? (
              <Text className="mb-2 text-center font-source text-sm text-slate-mid">
                Para enviar falta: {faltantes.join(', ')}.
              </Text>
            ) : null}
            {errorEnvio ? (
              <Text
                accessibilityLiveRegion="polite"
                className="mb-2 text-center font-source text-sm text-danger"
              >
                {errorEnvio}
              </Text>
            ) : null}
            <Button
              title="Enviar observación"
              size="lg"
              loading={enviando}
              disabled={faltantes.length > 0}
              onPress={() => void enviar()}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
