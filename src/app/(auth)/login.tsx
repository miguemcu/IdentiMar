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
import { Button, Card, Input, Badge } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; password?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const validarFormulario = () => {
    const nuevosErrores: { correo?: string; password?: string } = {};

    // dwc:format email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
      nuevosErrores.correo = 'El correo electrónico es requerido.';
    } else if (!emailRegex.test(correo.trim())) {
      nuevosErrores.correo = 'El formato del correo electrónico no es válido.';
    }

    // Contraseña: entre 8 y 128 caracteres según el contrato
    if (!password) {
      nuevosErrores.password = 'La contraseña es requerida.';
    } else if (password.length < 8 || password.length > 128) {
      nuevosErrores.password = 'La contraseña debe tener entre 8 y 128 caracteres.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleLogin = async () => {
    setErrorGeneral(null);

    if (!validarFormulario()) {
      setErrorGeneral('Uno o más campos no cumplen las restricciones.');
      return;
    }

    setCargando(true);
    try {
      await login({
        correo: correo.trim(),
        password,
      });
      // El SessionProvider redirige automáticamente a (tabs)
    } catch {
      // 401 CredencialesInvalidas según contrato
      setErrorGeneral('Correo o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  const llenarCredencialesRapidas = (email: string) => {
    setCorreo(email);
    setPassword('MiClaveSegura123!');
    setErrores({});
    setErrorGeneral(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Badge label="Bentos Costero" variant="ocean" size="sm" className="mb-2" />
          <Text className="text-3xl font-nunito-bold text-slate-deep text-center">
            IdentiMar
          </Text>
          <Text className="text-sm font-source text-slate-mid text-center mt-1">
            Registro e identificación de batoideos en el Urabá
          </Text>
        </View>

        <Card className="mb-6">
          <Text className="text-xl font-nunito-bold text-slate-deep mb-4">
            Iniciar Sesión
          </Text>

          {errorGeneral ? (
            <View className="bg-red-50 border border-danger/30 rounded-xl p-3 mb-4">
              <Text className="text-xs font-source text-danger">
                {errorGeneral}
              </Text>
            </View>
          ) : null}

          <Input
            label="Correo electrónico"
            placeholder="usuario@ejemplo.co"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={(val) => {
              setCorreo(val);
              if (errores.correo) setErrores((prev) => ({ ...prev, correo: undefined }));
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
              if (errores.password) setErrores((prev) => ({ ...prev, password: undefined }));
            }}
            error={errores.password}
          />

          <Button
            title="Ingresar a la plataforma"
            variant="primary"
            loading={cargando}
            onPress={handleLogin}
            className="mt-2"
          />

          <View className="flex-row items-center justify-center mt-5">
            <Text className="text-sm font-source text-slate-mid">
              ¿No tienes cuenta?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/registro' as any)}
              accessibilityRole="button"
            >
              <Text className="text-sm font-nunito-bold text-ocean">
                Regístrate aquí
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Accesos rápidos para probar los 3 roles en el mock */}
        <Card className="border border-ocean/20 bg-ocean/5">
          <Text className="text-xs font-nunito-bold text-ocean-dark mb-2">
            Accesos de prueba simulada (Roles):
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Button
              title="Usuario común"
              size="sm"
              variant="outline"
              onPress={() => llenarCredencialesRapidas('ana.torres@ejemplo.co')}
            />
            <Button
              title="Experto"
              size="sm"
              variant="outline"
              onPress={() => llenarCredencialesRapidas('carlos.mendoza@invemar.org.co')}
            />
            <Button
              title="Administrador"
              size="sm"
              variant="outline"
              onPress={() => llenarCredencialesRapidas('admin@identimar.udea.edu.co')}
            />
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
