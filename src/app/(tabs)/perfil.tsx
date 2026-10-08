import { Badge, Button, Card, ScreenHeader } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { ScrollView, Text, View } from "react-native";

const ROL_ETIQUETA: Record<string, string> = {
  usuario: "Observador",
  experto: "Experto validador",
  administrador: "Administrador",
};

const ROL_VARIANTE: Record<string, "ocean" | "ocre" | "danger"> = {
  usuario: "ocean",
  experto: "ocre",
  administrador: "danger",
};

export default function PerfilScreen() {
  const { usuario, rol, logout, cambiarRolMock } = useAuth();

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader title="Mi Perfil" subtitle="Datos de la sesión activa" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Datos del usuario */}
        <Card>
          <View className="flex-row items-start justify-between mb-3">
            <Text className="font-nunito-bold text-lg text-slate-deep flex-1 mr-2">
              {usuario?.nombre_completo ?? "—"}
            </Text>
            <Badge
              label={ROL_ETIQUETA[rol ?? "usuario"]}
              variant={ROL_VARIANTE[rol ?? "usuario"]}
              size="sm"
            />
          </View>

          <Text className="font-source text-sm text-slate-mid mb-1">
            {usuario?.correo ?? "—"}
          </Text>

          {usuario?.creado_en ? (
            <Text className="font-source text-xs text-slate-light">
              Cuenta creada el{" "}
              {new Date(usuario.creado_en).toLocaleDateString("es-CO", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          ) : null}
        </Card>

        {/* Cambio rápido de rol (solo ambiente simulado) */}
        <Card className="border border-ocean/20 bg-ocean/5">
          <Text className="font-nunito-bold text-xs text-ocean-dark mb-2">
            Cambiar rol de prueba (solo en modo simulado):
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                title="Observador"
                size="sm"
                variant={rol === "usuario" ? "primary" : "outline"}
                onPress={() => cambiarRolMock("usuario")}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Experto"
                size="sm"
                variant={rol === "experto" ? "secondary" : "outline"}
                onPress={() => cambiarRolMock("experto")}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Admin"
                size="sm"
                variant={rol === "administrador" ? "danger" : "outline"}
                onPress={() => cambiarRolMock("administrador")}
              />
            </View>
          </View>
        </Card>

        {/* Cerrar sesión */}
        <Button
          title="Cerrar sesión"
          variant="outline"
          onPress={logout}
          accessibilityLabel="Cerrar sesión y volver a la pantalla de inicio de sesión"
        />
      </ScrollView>
    </View>
  );
}
