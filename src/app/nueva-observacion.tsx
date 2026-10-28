import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { AVISO_ENVIO, CargaLenta } from '@/components/carga-lenta/carga-lenta';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Icono, Input, ScreenHeader } from '@/components/ui';
import { fechaIsoLocal, formatearFechaEvento } from '@/constants/formato';
import { useAuth } from '@/contexts/auth-context';
import { useBorradorObservacion } from '@/hooks/use-borrador-observacion';
import { useEnviarObservacion } from '@/hooks/use-enviar-observacion';
import type { BorradorObservacion } from '@/services/local/borrador';
import { copiarFotoBorrador } from '@/services/local/fotos';
import { catalogosService } from '@/services';
import { conCache } from '@/services/local/cache';
import { esSinConexion } from '@/services/local/cola-envio';
import { SinConexion } from '@/components/sin-conexion/sin-conexion';
import type { CatalogoItem } from '@/types';
import { Bloque, Opciones } from '@/components/nueva-observacion/bloques';
import {
  errorCoordenada,
  MAX_NOTAS,
  PASOS,
  validateImageAsset,
  type CoordinateField,
  type TemporaryCoordinates,
} from '@/constants/nueva-observacion';

export default function NuevaObservacionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
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
  // 'sin-conexion': no hay señal ni copia de los catálogos en el teléfono.
  const [errorCatalogos, setErrorCatalogos] = useState<boolean | 'sin-conexion'>(false);
  const [tipoAmbiente, setTipoAmbiente] = useState<string | null>(null);
  const [condicion, setCondicion] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [paso, setPaso] = useState(0);
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null);
  const previousAppState = useRef(AppState.currentState);

  // Al entrar, se recupera el formulario que quedó a medias.
  function aplicarBorrador(restaurado: BorradorObservacion) {
    const f = restaurado.foto;
    setImageAsset(f ? ({ ...f, type: 'image' } as ImagePicker.ImagePickerAsset) : null);
    setCoordinates(restaurado.coordenadas);
    setCoordinateInputs(restaurado.textoCoordenadas);
    setPrecisionGps(restaurado.precisionGps);
    setFechaEvento(new Date(restaurado.fechaEvento));
    setFechaFutura(new Date(restaurado.fechaEvento).getTime() > Date.now());
    setTipoAmbiente(restaurado.tipoAmbiente);
    setCondicion(restaurado.condicion);
    setNotas(restaurado.notas);
    setPaso(restaurado.paso);
  }
  const borrador = useBorradorObservacion(usuario?.id, aplicarBorrador);
  const { restaurado } = borrador;
  const { enviar, enviando, errorEnvio } = useEnviarObservacion(borrador.limpiar);

  // Cada cambio del formulario se guarda en el dispositivo.
  const { guardar } = borrador;
  useEffect(() => {
    guardar({
      foto: imageAsset
        ? {
            uri: imageAsset.uri,
            width: imageAsset.width,
            height: imageAsset.height,
            mimeType: imageAsset.mimeType ?? null,
            fileName: imageAsset.fileName ?? null,
          }
        : null,
      coordenadas: coordinates,
      textoCoordenadas: coordinateInputs,
      precisionGps,
      fechaEvento: fechaEvento.toISOString(),
      tipoAmbiente,
      condicion,
      notas,
      paso,
    });
  }, [guardar, imageAsset, coordinates, coordinateInputs, precisionGps, fechaEvento, tipoAmbiente, condicion, notas, paso]);

  function empezarDeNuevo() {
    borrador.limpiar();
    setImageAsset(null);
    setCoordinates({ latitud: null, longitud: null });
    setCoordinateInputs({ latitud: '', longitud: '' });
    setPrecisionGps(null);
    setFechaEvento(new Date());
    setFechaFutura(false);
    setTipoAmbiente(null);
    setCondicion(null);
    setNotas('');
    setPaso(0);
    setAvisoFoto(null);
  }

  const cargarCatalogos = useCallback(async () => {
    setErrorCatalogos(false);
    try {
      // Desde el teléfono si no hay señal: así se puede llenar el paso 3 sin red.
      const [tipos, conds] = await Promise.all([
        conCache('tipos-ambiente', () => catalogosService.obtenerTiposAmbiente()),
        conCache('condiciones', () => catalogosService.obtenerCondicionesOrganismo()),
      ]);
      setTiposAmbiente(tipos.datos);
      setCondiciones(conds.datos);
    } catch (error) {
      setErrorCatalogos(esSinConexion(error) ? 'sin-conexion' : true);
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
      // Sin términos como "JPEG" o "píxeles": se explica qué hacer.
      setImageValidationError(
        validation.hasValidFormat
          ? 'La foto es muy pequeña. Prueba tomándola con la cámara del teléfono.'
          : 'No podemos usar esta foto. Prueba tomándola con la cámara del teléfono.',
      );
      return;
    }

    // La copia local evita perder la foto si se cierra la app antes de enviar.
    const copia = usuario
      ? copiarFotoBorrador(usuario.id, selectedAsset.uri, selectedAsset.fileName ?? selectedAsset.uri)
      : null;
    setAvisoFoto(
      copia
        ? null
        : 'No pudimos guardar una copia de la foto en el teléfono. Puedes seguir, pero si cierras la app antes de enviar quizá tengas que elegirla de nuevo.',
    );
    setImageAsset(copia ? { ...selectedAsset, uri: copia } : selectedAsset);
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
        {restaurado ? (
          <Card className="border-sky-200 bg-sky-50">
            <Text accessibilityLiveRegion="polite" className="font-nunito-bold text-base text-slate-deep">
              Recuperamos tu observación sin terminar
            </Text>
            {borrador.fotoPerdida ? (
              <Text className="mt-1 font-source text-sm text-slate-mid">
                La foto ya no está en el teléfono. Tómala o elígela de nuevo.
              </Text>
            ) : null}
            <Button title="Empezar de nuevo" variant="ghost" onPress={empezarDeNuevo} className="mt-2" />
          </Card>
        ) : null}
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
            {avisoFoto ? (
              <Text accessibilityLiveRegion="polite" className="text-center font-source text-sm text-slate-mid">
                {avisoFoto}
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
            <CargaLenta activo={tiposAmbiente.length === 0 && !errorCatalogos} className="" />
            {errorCatalogos === 'sin-conexion' ? <SinConexion guardadoEn={null} /> : null}
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
        <CargaLenta activo={ultimoPaso && enviando} mensaje={AVISO_ENVIO} className="" />
        <Button
          title={ultimoPaso ? 'Enviar observación' : 'Siguiente'}
          size="lg"
          loading={ultimoPaso && enviando}
          disabled={faltantes.length > 0}
          onPress={() =>
            ultimoPaso
              ? void enviar({
                  imageAsset,
                  latitud: coordinates.latitud,
                  longitud: coordinates.longitud,
                  precisionGps,
                  fechaEvento,
                  tipoAmbiente,
                  condicion,
                  notas,
                })
              : setPaso(paso + 1)
          }
        />
      </View>
    </View>
  );
}
