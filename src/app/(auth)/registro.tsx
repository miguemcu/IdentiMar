import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { Button, Card, HeroHeader, Input } from '@/components/ui';

export default function RegistroScreen() {
  const router = useRouter();
  const { registro } = useAuth();

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');

  const [errores, setErrores] = useState<{
    nombre_completo?: string;
    correo?: string;
    password?: string;
    telefono?: string;
  }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const validarFormulario = () => {
    const nuevosErrores: typeof errores = {};

    // Nombre completo: entre 3 y 200 caracteres según contrato
    if (!nombreCompleto.trim()) {
      nuevosErrores.nombre_completo = 'Escribe tu nombre completo.';
    } else if (nombreCompleto.trim().length < 3 || nombreCompleto.trim().length > 200) {
      nuevosErrores.nombre_completo = 'El nombre debe tener entre 3 y 200 caracteres.';
    }

    // Correo: formato válido requerido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
      nuevosErrores.correo = 'Escribe tu correo.';
    } else if (!emailRegex.test(correo.trim())) {
      nuevosErrores.correo = 'Revisa el correo. Debe verse así: nombre@correo.com';
    }

    // Contraseña: entre 8 y 128 caracteres
    if (!password) {
      nuevosErrores.password = 'Escribe una contraseña.';
    } else if (password.length < 8 || password.length > 128) {
      nuevosErrores.password = 'La contraseña debe tener entre 8 y 128 caracteres.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleRegistro = async () => {
    setErrorGeneral(null);

    if (!validarFormulario()) {
      setErrorGeneral('Revisa los datos marcados en rojo.');
      return;
    }

    setCargando(true);
    try {
      await registro({
        nombre_completo: nombreCompleto.trim(),
        correo: correo.trim(),
        password,
        telefono: telefono.trim() ? telefono.trim() : null,
      });
      // El SessionProvider actualiza el usuario y redirige automáticamente
    } catch {
      // 409 según contrato si ya está registrado
      setErrorGeneral('Ya hay una cuenta con ese correo. Intenta entrar con él.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <HeroHeader
          antetitulo="IdentiMar"
          titulo="Crea tu cuenta"
          subtitulo="Con tu cuenta guardas tus registros de rayas y ves qué especie es cada una."
          conCruce
        />

        <Card className="mx-4 -mt-12 shadow-lg">
          {errorGeneral ? (
            <View className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <Text
                accessibilityLiveRegion="polite"
                className="font-source text-sm text-danger"
              >
                {errorGeneral}
              </Text>
            </View>
          ) : null}

          <Input
            label="Nombre completo"
            placeholder="Ej. Ana María Torres"
            value={nombreCompleto}
            onChangeText={(val) => {
              setNombreCompleto(val);
              if (errores.nombre_completo) {
                setErrores((prev) => ({ ...prev, nombre_completo: undefined }));
              }
            }}
            error={errores.nombre_completo}
          />

          <Input
            label="Correo"
            placeholder="nombre@correo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={(val) => {
              setCorreo(val);
              if (errores.correo) {
                setErrores((prev) => ({ ...prev, correo: undefined }));
              }
            }}
            error={errores.correo}
          />

          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            secureTextEntry
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (errores.password) {
                setErrores((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={errores.password}
            helperText="Mínimo 8 caracteres"
          />

          <Input
            label="Celular (opcional)"
            placeholder="Ej. 300 123 4567"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
            helperText="Solo para contactarte si hace falta"
          />

          <Button
            title="Crear mi cuenta"
            size="lg"
            loading={cargando}
            onPress={handleRegistro}
            className="mt-2"
          />

          <View className="mt-4 flex-row flex-wrap items-center justify-center">
            <Text className="font-source text-base text-slate-mid">
              ¿Ya tienes cuenta?{' '}
            </Text>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="link"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="min-h-[44px] justify-center active:opacity-70"
            >
              <Text className="font-nunito-bold text-base text-ocean">
                Entra aquí
              </Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
