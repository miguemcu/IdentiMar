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
import { Button, Card, Chip, HeroHeader, Input } from '@/components/ui';
import { MODO_SIMULADO } from '@/services';

/** Cuentas del mock para entrar rápido con cada rol (solo con datos simulados). */
const CUENTAS_PRUEBA = [
  { etiqueta: 'Observador', correo: 'ana.torres@ejemplo.co' },
  { etiqueta: 'Experto', correo: 'carlos.mendoza@invemar.org.co' },
  { etiqueta: 'Administrador', correo: 'admin@identimar.udea.edu.co' },
];

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
      nuevosErrores.correo = 'Escribe tu correo.';
    } else if (!emailRegex.test(correo.trim())) {
      nuevosErrores.correo = 'Revisa el correo. Debe verse así: nombre@correo.com';
    }

    // Contraseña: entre 8 y 128 caracteres según el contrato
    if (!password) {
      nuevosErrores.password = 'Escribe tu contraseña.';
    } else if (password.length < 8 || password.length > 128) {
      nuevosErrores.password = 'La contraseña debe tener entre 8 y 128 caracteres.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleLogin = async () => {
    setErrorGeneral(null);

    if (!validarFormulario()) {
      setErrorGeneral('Revisa los datos marcados en rojo.');
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
      setErrorGeneral('El correo o la contraseña no coinciden.');
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
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <HeroHeader
          antetitulo="Bienvenido a"
          titulo="IdentiMar"
          subtitulo="Registra las rayas que encuentres en el Urabá y descubre qué especie es."
          conCruce
        />

        <Card className="mx-4 -mt-12 shadow-lg">
          <Text
            accessibilityRole="header"
            className="mb-4 font-nunito-extrabold text-xl text-slate-deep"
          >
            Entrar
          </Text>

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
            label="Correo"
            placeholder="nombre@correo.com"
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
            title="Entrar"
            size="lg"
            loading={cargando}
            onPress={handleLogin}
            className="mt-2"
          />

          <View className="mt-4 flex-row flex-wrap items-center justify-center">
            <Text className="font-source text-base text-slate-mid">
              ¿No tienes cuenta?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/registro' as any)}
              accessibilityRole="link"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="min-h-[44px] justify-center active:opacity-70"
            >
              <Text className="font-nunito-bold text-base text-ocean">
                Créala aquí
              </Text>
            </Pressable>
          </View>
        </Card>

        {MODO_SIMULADO ? (
          <Card className="mx-4 mt-6 border-sky-200 bg-sky-50">
            <Text className="font-nunito-bold text-base text-slate-deep">
              Cuentas de prueba
            </Text>
            <Text className="mt-0.5 font-source text-sm text-slate-mid">
              Solo con datos simulados. Llena el correo y la contraseña.
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {CUENTAS_PRUEBA.map((cuenta) => (
                <Chip
                  key={cuenta.correo}
                  etiqueta={cuenta.etiqueta}
                  activo={correo === cuenta.correo}
                  onPress={() => llenarCredencialesRapidas(cuenta.correo)}
                />
              ))}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
