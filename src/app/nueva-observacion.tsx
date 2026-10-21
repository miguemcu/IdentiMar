import { useState } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Button, Card, ScreenHeader } from '@/components/ui';

export default function NuevaObservacionScreen() {
  const router = useRouter();
  const [imageAsset, setImageAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);

  async function takePhoto() {
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
      setImageAsset(selectedAsset);
    }
  }

  async function chooseFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    const selectedAsset = result.canceled ? undefined : result.assets[0];
    if (selectedAsset) {
      setImageAsset(selectedAsset);
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
          <Button
            title={imageAsset ? 'Tomar foto nuevamente' : 'Tomar foto'}
            onPress={takePhoto}
            className="w-full"
          />
          <Button
            title={imageAsset ? 'Elegir de la galería ' : 'Elegir de la galería'}
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
