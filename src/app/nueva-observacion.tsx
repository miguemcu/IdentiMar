import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Linking, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Button, Card, Input, ScreenHeader } from '@/components/ui';

// TODO(contrato): reemplazar estos nombres cuando el Equipo 3 confirme el contrato.
type TemporaryCoordinates = {
  latitud: number | null;
  longitud: number | null;
};

type CoordinateField = keyof TemporaryCoordinates;

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
  const [imageValidationError, setImageValidationError] = useState<
    string | null
  >(null);
  const previousAppState = useRef(AppState.currentState);

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
        previousAppState.current.match(/inactive|background/) &&
        nextAppState === 'active';
      previousAppState.current = nextAppState;

      if (returnedToApp) {
        void captureLocation(false);
      }
    });

    return () => subscription.remove();
  }, [captureLocation, imageAsset, locationPermissionDenied]);

  function updateCoordinate(field: CoordinateField, value: string) {
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
        }}
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
                value={coordinateInputs.latitud}
                onChangeText={(value) => updateCoordinate('latitud', value)}
                keyboardType="decimal-pad"
                placeholder="Ej. 8.123456"
                accessibilityLabel="Latitud del avistamiento"
              />
              <Input
                label="Longitud"
                value={coordinateInputs.longitud}
                onChangeText={(value) => updateCoordinate('longitud', value)}
                keyboardType="decimal-pad"
                placeholder="Ej. -76.123456"
                accessibilityLabel="Longitud del avistamiento"
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
      </ScrollView>
    </View>
  );
}
