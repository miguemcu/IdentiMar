import { Text, View, type ViewProps } from "react-native";
import type { EstadoObservacion } from "../../types";

export interface EstadoBadgeProps extends ViewProps {
  estado: EstadoObservacion;
  size?: "sm" | "md";
  className?: string;
}

interface EstadoConfig {
  label: string;
  containerClass: string;
  textClass: string;
}

const ESTADOS_MAP: Record<EstadoObservacion, EstadoConfig> = {
  recibido: {
    label: "Recibido",
    containerClass: "bg-ocean/15 border border-ocean/30",
    textClass: "text-ocean-dark font-nunito-bold",
  },
  procesando: {
    label: "En procesamiento",
    containerClass: "bg-ocre/30 border border-ocre-dark/30",
    textClass: "text-ochre-dark font-nunito-bold",
  },
  identificado: {
    label: "Identificado",
    containerClass: "bg-emerald-100 border border-emerald-300",
    textClass: "text-emerald-800 font-nunito-bold",
  },
  no_concluyente: {
    label: "No concluyente",
    containerClass: "bg-orange-100 border border-orange-300",
    textClass: "text-orange-800 font-nunito-bold",
  },
  pendiente_experto: {
    label: "Pendiente de experto",
    containerClass: "bg-amber-100 border border-amber-300",
    textClass: "text-amber-900 font-nunito-bold",
  },
  validado: {
    label: "Validado",
    containerClass: "bg-emerald-200/80 border border-emerald-400",
    textClass: "text-emerald-900 font-nunito-bold",
  },
  corregido: {
    label: "Corregido",
    containerClass: "bg-sky-100 border border-sky-300",
    textClass: "text-sky-900 font-nunito-bold",
  },
};

export function EstadoBadge({
  estado,
  size = "md",
  className = "",
  ...rest
}: EstadoBadgeProps) {
  const config = ESTADOS_MAP[estado] ?? {
    label: estado,
    containerClass: "bg-slate-200 border border-slate-300",
    textClass: "text-slate-deep font-nunito-bold",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5",
    md: "px-2.5 py-1",
  }[size];

  const textSizeStyles = {
    sm: "text-xs",
    md: "text-xs",
  }[size];

  return (
    <View
      className={`self-start flex-row items-center justify-center rounded-full ${config.containerClass} ${sizeStyles} ${className}`}
      {...rest}
    >
      <Text className={`${config.textClass} ${textSizeStyles}`}>
        {config.label}
      </Text>
    </View>
  );
}
