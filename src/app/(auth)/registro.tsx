import { Button, Card, Input, ScreenHeader } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function RegistroScreen() {
  const router = useRouter();
  const { registro } = useAuth();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState("");

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
      nuevosErrores.nombre_completo = "El nombre completo es requerido.";
    } else if (
      nombreCompleto.trim().length < 3 ||
      nombreCompleto.trim().length > 200
    ) {
      nuevosErrores.nombre_completo =
        "El nombre debe tener entre 3 y 200 caracteres.";
    }

    // Correo: formato válido requerido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correo.trim()) {
      nuevosErrores.correo = "El correo electrónico es requerido.";
    } else if (!emailRegex.test(correo.trim())) {
      nuevosErrores.correo = "El formato del correo electrónico no es válido.";
    }

    // Contraseña: entre 8 y 128 caracteres
    if (!password) {
      nuevosErrores.password = "La contraseña es requerida.";
    } else if (password.length < 8 || password.length > 128) {
      nuevosErrores.password =
        "La contraseña debe tener entre 8 y 128 caracteres.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleRegistro = async () => {
    setErrorGeneral(null);

    if (!validarFormulario()) {
      setErrorGeneral("Uno o más campos no cumplen las restricciones.");
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
      setErrorGeneral("El correo ya está registrado.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface"
    >
      <ScreenHeader
        title="Crear cuenta"
        subtitle="Registro de observador en IdentiMar"
        onBack={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Card className="mb-6">
          {errorGeneral ? (
            <View className="bg-red-50 border border-danger/30 rounded-xl p-3 mb-4">
              <Text className="text-xs font-source text-danger">
                {errorGeneral}
              </Text>
            </View>
          ) : null}

          <Input
            label="Nombre completo"
            placeholder="Ana María Torres"
            value={nombreCompleto}
            onChangeText={(val) => {
              setNombreCompleto(val);
              if (errores.nombre_completo) {
                setErrores((prev) => ({ ...prev, nombre_completo: undefined }));
              }
            }}
            error={errores.nombre_completo}
            helperText="Entre 3 y 200 caracteres"
          />

          <Input
            label="Correo electrónico"
            placeholder="ana.torres@ejemplo.co"
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
            helperText="Entre 8 y 128 caracteres"
          />

          <Input
            label="Teléfono de contacto (opcional)"
            placeholder="+573001234567"
            keyboardType="phone-pad"
            value={telefono}
            onChangeText={setTelefono}
            helperText="dwc:contactInformation"
          />

          <Button
            title="Completar registro"
            variant="primary"
            loading={cargando}
            onPress={handleRegistro}
            className="mt-3"
          />

          <View className="flex-row items-center justify-center mt-5">
            <Text className="text-sm font-source text-slate-mid">
              ¿Ya tienes cuenta?{" "}
            </Text>
            <Pressable onPress={() => router.back()} accessibilityRole="button">
              <Text className="text-sm font-nunito-bold text-ocean">
                Inicia sesión
              </Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
