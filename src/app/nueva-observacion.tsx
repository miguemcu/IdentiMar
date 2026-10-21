import { useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Button, Card, ScreenHeader } from '@/components/ui';

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
  const [imageValidationError, setImageValidationError] = useState<
    string | null
  >(null);

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
      <View className="flex-1 items-center justify-center p-6">
        <Card className="w-full border border-ocean/20">
          {imageAsset ? (
            <Image
              source={{ uri: imageAsset.uri }}
              resizeMode="contain"
              accessibilityLabel="Vista previa de la foto seleccionada"
              className="mt-4 h-64 w-full"
            />
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
      </View>
    </View>
  );
}
