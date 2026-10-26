import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
import {
  authService,
  ErrorServicio,
  MODO_SIMULADO,
  observacionesService,
} from '@/services';
import type { Rol, UsuarioPublico } from '@/types';

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
  const router = useRouter();
  const { usuario, rol, logout, cambiarRolMock } = useAuth();
  const [cifras, setCifras] = useState<Cifras | null>(null);
  // Datos de GET /auth/perfil. Mientras llegan, o si fallan, se usan los de la sesión.
  const [perfil, setPerfil] = useState<UsuarioPublico | null>(null);
  const [perfilFallo, setPerfilFallo] = useState(false);
  // Se marca al instante mientras el mock simula la espera de la red.
  const [rolElegido, setRolElegido] = useState<Rol | null>(null);

  async function elegirRol(opcion: Rol) {
    if (opcion === (rolElegido ?? rol)) return;
    setRolElegido(opcion);
    try {
      await cambiarRolMock(opcion);
    } finally {
      setRolElegido(null);
    }
  }

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

  const cargarPerfil = useCallback(async () => {
    try {
      setPerfil(await authService.obtenerPerfil());
      setPerfilFallo(false);
    } catch (error) {
      if (error instanceof ErrorServicio && error.status === 401) {
        void logout('sesion-vencida');
        return;
      }
      setPerfilFallo(true);
    }
  }, [logout]);

  // `usuario?.id` en las dependencias: tras cambiar de cuenta o de rol de
  // prueba se vuelve a pedir el perfil.
  const usuarioId = usuario?.id;
  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => {
        void cargarCifras();
        if (usuarioId) void cargarPerfil();
      });
    }, [cargarCifras, cargarPerfil, usuarioId]),
  );

  // Solo se usa el perfil si es de la cuenta en sesión.
  const datos = perfil && perfil.id === usuario?.id ? perfil : usuario;
  const rolMostrado = datos?.rol ?? rol;
  const nombre = datos?.nombre_completo ?? '—';
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
        subtitulo={ROL_ETIQUETA[rolMostrado ?? 'usuario']}
        derecha={<Avatar nombre={nombre} />}
        conCruce
      />

      <Card className="mx-4 -mt-12 flex-row py-2 shadow-lg">
        <StatTile variante="claro" valor={cifra(cifras?.registros)} etiqueta="Registros" />
        <StatTile variante="claro" valor={cifra(cifras?.especies)} etiqueta="Especies" />
        <StatTile variante="claro" valor={cifra(cifras?.validadas)} etiqueta="Validadas" />
      </Card>

      <View className="mt-6 gap-4 px-4">
        <View className="rounded-3xl bg-slate-deep p-4">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-ocre">
              <Icono nombre="verificado" size={28} className="text-slate-deep" />
            </View>
            <View className="flex-1">
              <Text className="font-nunito-extrabold text-lg text-white">
                {esValidador ? 'Eres validador' : '¿Quieres ser experto?'}
              </Text>
              <Text className="mt-0.5 font-source text-sm text-white">
                {esValidador
                  ? 'Puedes revisar las observaciones que la app no pudo reconocer.'
                  : 'Para certificarte como experto, comunícate con el administrador de IdentiMar.'}
              </Text>
            </View>
          </View>
          {esValidador ? (
            <Button
              title="Ver observaciones por validar"
              variant="secondary"
              onPress={() => router.push('/validacion/pendientes' as any)}
              className="mt-4 w-full"
            />
          ) : null}
        </View>

        <Card>
          <Text
            accessibilityRole="header"
            className="mb-1 font-nunito-extrabold text-lg text-slate-deep"
          >
            Información personal
          </Text>
          <Fila etiqueta="Nombre" valor={nombre} />
          <Fila etiqueta="Correo" valor={datos?.correo ?? '—'} />
          <Fila etiqueta="Rol" valor={ROL_ETIQUETA[rolMostrado ?? 'usuario']} />
          {datos?.creado_en ? (
            <Fila
              etiqueta="Desde"
              valor={new Date(datos.creado_en).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
              })}
            />
          ) : null}
          {perfilFallo ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 font-source text-sm text-slate-mid"
            >
              No pudimos actualizar tus datos. Se muestran los de tu última sesión.
            </Text>
          ) : null}
        </Card>

        {MODO_SIMULADO ? (
          <Card className="border-sky-200 bg-sky-50">
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
                  activo={(rolElegido ?? rol) === opcion}
                  onPress={() => void elegirRol(opcion)}
                />
              ))}
            </View>
          </Card>
        ) : null}

        <Button
          title="Cerrar sesión"
          variant="outline"
          leftIcon={<Icono nombre="salir" size={20} className="text-ocean" />}
          onPress={() => void logout()}
          accessibilityLabel="Cerrar sesión y volver a la pantalla de inicio de sesión"
        />
      </View>
    </ScrollView>
  );
}
