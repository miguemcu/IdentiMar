import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, Icono, Input, ScreenHeader, type NombreIcono } from '@/components/ui';
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

/**
 * Tipo de la imagen. Algunos Android no informan `mimeType`; en ese caso
 * se deduce de la extensión del archivo.
 */
function tipoImagen(
  asset: ImagePicker.ImagePickerAsset,
): ImagenObservacion['mimeType'] | null {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType) return null;

  const extension = /\.(\w+)(?:\?.*)?$/
    .exec(asset.fileName ?? asset.uri)?.[1]
    ?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  return null;
}

function imagenParaEnvio(asset: ImagePicker.ImagePickerAsset): ImagenObservacion {
  // validateImageAsset ya garantizó JPEG o PNG.
  const mimeType = tipoImagen(asset) ?? 'image/jpeg';
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  return {
    uri: asset.uri,
    mimeType,
    nombre: asset.fileName ?? `observacion.${extension}`,
  };
}

const PASOS = ['Foto', 'Dónde y cuándo', 'Sobre el animal'] as const;

/** Tarjeta de un bloque del formulario con ícono y título. */
function Bloque({
  icono,
  titulo,
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View className="mb-3 flex-row items-center gap-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-ocean/10">
          <Icono nombre={icono} size={20} className="text-ocean-dark" />
        </View>
        <Text
          accessibilityRole="header"
          className="font-nunito-extrabold text-lg text-slate-deep"
        >
          {titulo}
        </Text>
      </View>
      {children}
    </Card>
  );
}

function Opciones({
  opciones,
  seleccion,
  onSeleccionar,
}: {
  opciones: CatalogoItem[];
  seleccion: string | null;
  onSeleccionar: (codigo: string) => void;
}) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
      {opciones.map((opcion) => (
        <Chip
          key={opcion.id}
          etiqueta={opcion.nombre_visible}
          activo={opcion.codigo === seleccion}
          onPress={() => onSeleccionar(opcion.codigo)}
          accessibilityHint={opcion.descripcion ?? undefined}
        />
      ))}
    </View>
  );
}

function validateImageAsset(asset: ImagePicker.ImagePickerAsset) {
  const hasValidFormat = tipoImagen(asset) !== null;
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
  const [paso, setPaso] = useState(0);
  const previousAppState = useRef(AppState.currentState);
  const camaraInicialAbierta = useRef(false);

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

  const faltantesPorPaso = [
    [!imageAsset && 'una foto'],
    [!ubicacionValida && 'la ubicación', fechaFutura && 'una fecha válida'],
    [!tipoAmbiente && 'dónde estaba', !condicion && 'cómo estaba el animal'],
  ].map((lista) =>
    lista.filter((faltante): faltante is string => typeof faltante === 'string'),
  );
  const faltantes = faltantesPorPaso[paso];
  const ultimoPaso = paso === PASOS.length - 1;

  function volver() {
    if (paso > 0) {
      setPaso(paso - 1);
    } else {
      router.back();
    }
  }

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
      router.replace(`/observaciones/resultado/${resumen.id}` as any);
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

  // Al entrar se abre la cámara de una vez; si se cancela, el paso 1 ofrece
  // abrirla de nuevo o elegir de la galería.
  useEffect(() => {
    if (camaraInicialAbierta.current) return;
    camaraInicialAbierta.current = true;
    queueMicrotask(() => {
      void takePhoto();
    });
    // takePhoto solo se usa en el primer render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        title="Nueva observación"
        subtitle={`Paso ${paso + 1} de ${PASOS.length} · ${PASOS[paso]}`}
        onBack={volver}
      />
      <View
        accessible
        accessibilityLabel={`Paso ${paso + 1} de ${PASOS.length}`}
        className="flex-row gap-1.5 bg-surface px-4 pb-2 pt-1"
      >
        {PASOS.map((nombre, indice) => (
          <View
            key={nombre}
            className={`h-1.5 flex-1 rounded-full ${
              indice <= paso ? 'bg-ocean' : 'bg-slate-light/30'
            }`}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16 }}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        {paso === 0 ? (
          <>
            {imageAsset ? (
              <Image
                source={{ uri: imageAsset.uri }}
                resizeMode="cover"
                accessibilityLabel="Vista previa de la foto seleccionada"
                className="h-80 w-full rounded-3xl bg-slate-light/20"
              />
            ) : (
              <Card className="items-center py-8">
                <View className="h-20 w-20 items-center justify-center rounded-3xl bg-ocean/10">
                  <Icono nombre="camara" size={40} className="text-ocean-dark" />
                </View>
                <Text className="mt-4 text-center font-nunito-extrabold text-xl text-slate-deep">
                  Toma una foto de la raya
                </Text>
                <View className="mt-3 gap-1">
                  {[
                    'Que se vea el animal completo',
                    'Con buena luz, sin sombras fuertes',
                    'Desde arriba si es posible',
                  ].map((consejo) => (
                    <Text
                      key={consejo}
                      className="text-center font-source text-base text-slate-mid"
                    >
                      {consejo}
                    </Text>
                  ))}
                </View>
              </Card>
            )}

            {imageValidationError ? (
              <Text
                accessibilityLiveRegion="polite"
                className="text-center font-source text-base text-danger"
              >
                {imageValidationError}
              </Text>
            ) : null}

            <View className="flex-row gap-3">
              <Button
                title={imageAsset ? 'Tomar otra' : 'Abrir cámara'}
                variant={imageAsset ? 'outline' : 'primary'}
                leftIcon={
                  <Icono
                    nombre="camara"
                    size={20}
                    className={imageAsset ? 'text-ocean' : 'text-white'}
                  />
                }
                onPress={() => void takePhoto()}
                className="flex-1"
              />
              <Button
                title="Galería"
                variant="outline"
                leftIcon={<Icono nombre="galeria" size={20} className="text-ocean" />}
                onPress={() => void chooseFromGallery()}
                className="flex-1"
              />
            </View>

            {cameraPermissionDenied ? (
              <Card className="border-danger/40">
                <Text className="font-source text-base text-slate-deep">
                  Necesitamos acceso a la cámara para tomar la foto. También
                  puedes elegirla de la galería.
                </Text>
                <Button
                  title="Abrir ajustes"
                  variant="ghost"
                  onPress={() => Linking.openSettings()}
                  className="mt-2"
                />
              </Card>
            ) : null}
          </>
        ) : null}

        {paso === 1 ? (
          <>
            <Bloque icono="ubicacion" titulo="Ubicación">
              {isGettingLocation ? (
                <Text className="font-source text-base text-slate-mid">
                  Obteniendo ubicación…
                </Text>
              ) : null}
              {locationPermissionDenied ? (
                <View className="gap-2">
                  <Text className="font-source text-base text-danger">
                    No se permitió acceder a la ubicación. Puedes ingresarla
                    manualmente.
                  </Text>
                  <Button
                    title="Abrir ajustes"
                    variant="primary"
                    onPress={() => Linking.openSettings()}
                  />
                  <Button
                    title="Intentar de nuevo"
                    variant="outline"
                    onPress={() => void captureLocation()}
                    disabled={isGettingLocation}
                  />
                </View>
              ) : null}
              {locationError ? (
                <Text className="font-source text-base text-danger">
                  {locationError}
                </Text>
              ) : null}
              {coordinates.latitud !== null && coordinates.longitud !== null ? (
                <Text className="font-source-semibold text-base text-slate-deep">
                  {coordinates.latitud.toFixed(6)}°, {coordinates.longitud.toFixed(6)}°
                  {precisionGps !== null
                    ? `  ·  ± ${Math.round(precisionGps)} m`
                    : ''}
                </Text>
              ) : null}
              <Text className="mb-3 mt-1 font-source text-sm text-slate-mid">
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
                containerClassName="mb-0"
              />
            </Bloque>

            <Bloque icono="calendario" titulo="Fecha y hora">
              <Text
                className={`font-source-semibold text-lg ${
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
              <View className="mt-3 flex-row gap-2">
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
                  is24Hour={false}
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
            </Bloque>
          </>
        ) : null}

        {paso === 2 ? (
          <>
            {errorCatalogos ? (
              <Card>
                <Text className="font-source text-base text-danger">
                  No pudimos cargar las opciones del formulario.
                </Text>
                <Button
                  title="Reintentar"
                  variant="outline"
                  onPress={() => void cargarCatalogos()}
                  className="mt-2"
                />
              </Card>
            ) : (
              <>
                <Bloque icono="ubicacion" titulo="¿Dónde estaba?">
                  <Opciones
                    opciones={tiposAmbiente}
                    seleccion={tipoAmbiente}
                    onSeleccionar={setTipoAmbiente}
                  />
                </Bloque>
                <Bloque icono="especies" titulo="¿Cómo estaba el animal?">
                  <Opciones
                    opciones={condiciones}
                    seleccion={condicion}
                    onSeleccionar={setCondicion}
                  />
                </Bloque>
              </>
            )}

            <Bloque icono="registros" titulo="Notas (opcional)">
              <Input
                value={notas}
                onChangeText={setNotas}
                maxLength={MAX_NOTAS}
                multiline
                textAlignVertical="top"
                className="min-h-[96px]"
                placeholder="Ej. La vi cerca de la desembocadura del río"
                helperText={`${notas.length} / ${MAX_NOTAS}`}
                accessibilityLabel="Notas del avistamiento"
                containerClassName="mb-0"
              />
            </Bloque>
          </>
        ) : null}
      </ScrollView>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="gap-2 border-t border-slate-light/20 bg-white px-4 pt-3"
      >
        {faltantes.length > 0 ? (
          <Text className="text-center font-source text-sm text-slate-mid">
            {ultimoPaso ? 'Para enviar' : 'Para continuar'} falta:{' '}
            {faltantes.join(', ')}.
          </Text>
        ) : null}
        {ultimoPaso && errorEnvio ? (
          <Text
            accessibilityLiveRegion="polite"
            className="text-center font-source text-sm text-danger"
          >
            {errorEnvio}
          </Text>
        ) : null}
        <Button
          title={ultimoPaso ? 'Enviar observación' : 'Siguiente'}
          size="lg"
          loading={ultimoPaso && enviando}
          disabled={faltantes.length > 0}
          onPress={() => (ultimoPaso ? void enviar() : setPaso(paso + 1))}
        />
      </View>
    </View>
  );
}
