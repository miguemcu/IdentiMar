import type { ComponentType } from 'react';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { cssInterop } from 'nativewind';

// Permite colorear el ícono con clases de texto (text-ocean, text-white…)
// en lugar de escribir colores hexadecimales en los componentes.
cssInterop(SymbolView, {
  className: { target: 'style', nativeStyleToProp: { color: 'tintColor' } },
});

const SymbolConClase = SymbolView as unknown as ComponentType<
  SymbolViewProps & { className?: string }
>;

/** Íconos de la app: SF Symbols en iOS y Material Symbols en Android. */
const ICONOS = {
  inicio: { ios: 'house.fill', android: 'home', web: 'home' },
  registros: {
    ios: 'list.bullet.clipboard.fill',
    android: 'description',
    web: 'description',
  },
  especies: { ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' },
  perfil: {
    ios: 'person.circle.fill',
    android: 'account_circle',
    web: 'account_circle',
  },
  camara: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  galeria: {
    ios: 'photo.on.rectangle',
    android: 'photo_library',
    web: 'photo_library',
  },
  agregar: { ios: 'plus', android: 'add', web: 'add' },
  atras: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  siguiente: {
    ios: 'chevron.right',
    android: 'chevron_right',
    web: 'chevron_right',
  },
  cerrar: { ios: 'xmark', android: 'close', web: 'close' },
  buscar: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  ubicacion: {
    ios: 'mappin.and.ellipse',
    android: 'location_on',
    web: 'location_on',
  },
  calendario: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  verificado: {
    ios: 'checkmark.seal.fill',
    android: 'verified',
    web: 'verified',
  },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  sinConexion: { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' },
  idea: { ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' },
  salir: {
    ios: 'rectangle.portrait.and.arrow.right',
    android: 'logout',
    web: 'logout',
  },
  ampliar: {
    ios: 'arrow.up.left.and.arrow.down.right',
    android: 'open_in_full',
    web: 'open_in_full',
  },
  guardar: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
  compartir: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type NombreIcono = keyof typeof ICONOS;

export interface IconoProps {
  nombre: NombreIcono;
  size?: number;
  /** Clase de color de texto, por ejemplo "text-ocean". */
  className?: string;
}

/** Ícono decorativo: el texto que lo acompaña es el que se lee en voz alta. */
export function Icono({ nombre, size = 22, className = 'text-slate-deep' }: IconoProps) {
  return (
    <SymbolConClase
      name={ICONOS[nombre]}
      size={size}
      className={className}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
