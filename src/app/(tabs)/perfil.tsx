import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import {
  Avatar,
  Button,
  Card,
  Chip,
  HeroHeader,
  Icono,
  StatTile,
} from '@/components/ui';
import { MODO_SIMULADO, observacionesService } from '@/services';
import type { Rol } from '@/types';

const ROL_ETIQUETA: Record<Rol, string> = {
  usuario: 'Observador',
  experto: 'Experto validador',
  administrador: 'Administrador',
};

const ROLES: Rol[] = ['usuario', 'experto', 'administrador'];

interface Cifras {
  registros: number;
  especies: number;
  validadas: number;
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 border-b border-slate-light/20 py-3">
      <Text className="font-source text-base text-slate-mid">{etiqueta}</Text>
      <Text className="flex-1 text-right font-source-semibold text-base text-slate-deep">
        {valor}
      </Text>
    </View>
  );
}

export default function PerfilScreen() {
  const { usuario, rol, logout, cambiarRolMock } = useAuth();
  const [cifras, setCifras] = useState<Cifras | null>(null);

  // Una página de hasta 100 registros (máximo del contrato): las especies
  // distintas y las validadas se cuentan sobre esa página.
  const cargarCifras = useCallback(async () => {
    try {
      const pagina = await observacionesService.listarObservaciones({ tamano: 100 });
      const especies = new Set(
        pagina.items
          .map((obs) => obs.especie_aceptada?.codigo)
          .filter((codigo): codigo is string => !!codigo),
      );
      setCifras({
        registros: pagina.total,
        especies: especies.size,
        validadas: pagina.items.filter(
          (obs) => obs.estado === 'validado' || obs.estado === 'corregido',
        ).length,
      });
    } catch {
      setCifras(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => {
        void cargarCifras();
      });
    }, [cargarCifras]),
  );

  const nombre = usuario?.nombre_completo ?? '—';
  const esValidador = rol === 'experto' || rol === 'administrador';
  const cifra = (valor: number | undefined) => valor ?? '–';

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <HeroHeader
        antetitulo="Mi perfil"
        titulo={nombre}
        subtitulo={ROL_ETIQUETA[rol ?? 'usuario']}
        derecha={<Avatar nombre={nombre} />}
        conCruce
      />

      <Card className="mx-4 -mt-12 flex-row py-2 shadow-lg">
        <StatTile variante="claro" valor={cifra(cifras?.registros)} etiqueta="Registros" />
        <StatTile variante="claro" valor={cifra(cifras?.especies)} etiqueta="Especies" />
        <StatTile variante="claro" valor={cifra(cifras?.validadas)} etiqueta="Validadas" />
      </Card>

      <View className="mt-6 gap-4 px-4">
        <View className="flex-row items-center gap-4 rounded-3xl bg-slate-deep p-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-ocre">
            <Icono nombre="verificado" size={28} className="text-slate-deep" />
          </View>
          <View className="flex-1">
            <Text className="font-nunito-extrabold text-lg text-white">
              {esValidador ? 'Eres validador' : '¿Quieres ser experto?'}
            </Text>
            <Text className="mt-0.5 font-source text-sm text-white">
              {esValidador
                ? 'Puedes revisar las observaciones que el modelo no pudo confirmar.'
                : 'Para certificarte como experto, comunícate con el administrador de IdentiMar.'}
            </Text>
          </View>
        </View>

        <Card>
          <Text
            accessibilityRole="header"
            className="mb-1 font-nunito-extrabold text-lg text-slate-deep"
          >
            Información personal
          </Text>
          <Fila etiqueta="Nombre" valor={nombre} />
          <Fila etiqueta="Correo" valor={usuario?.correo ?? '—'} />
          <Fila etiqueta="Rol" valor={ROL_ETIQUETA[rol ?? 'usuario']} />
          {usuario?.creado_en ? (
            <Fila
              etiqueta="Desde"
              valor={new Date(usuario.creado_en).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
              })}
            />
          ) : null}
        </Card>

        {MODO_SIMULADO ? (
          <Card className="border-ocean/30 bg-ocean/5">
            <Text className="font-nunito-bold text-base text-slate-deep">
              Cambiar rol de prueba
            </Text>
            <Text className="mt-0.5 font-source text-sm text-slate-mid">
              Solo con datos simulados.
            </Text>
            <View
              accessibilityRole="radiogroup"
              className="mt-3 flex-row flex-wrap gap-2"
            >
              {ROLES.map((opcion) => (
                <Chip
                  key={opcion}
                  etiqueta={ROL_ETIQUETA[opcion]}
                  activo={rol === opcion}
                  onPress={() => void cambiarRolMock(opcion)}
                />
              ))}
            </View>
          </Card>
        ) : null}

        <Button
          title="Cerrar sesión"
          variant="outline"
          leftIcon={<Icono nombre="salir" size={20} className="text-ocean" />}
          onPress={logout}
          accessibilityLabel="Cerrar sesión y volver a la pantalla de inicio de sesión"
        />
      </View>
    </ScrollView>
  );
}
