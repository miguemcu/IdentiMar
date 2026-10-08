import React from "react";
import { Text, View, type ViewProps } from "react-native";

export type BadgeVariant =
  | "ocean"
  | "ocre"
  | "success"
  | "warning"
  | "danger"
  | "slate";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends ViewProps {
  label?: string;
  children?: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export function Badge({
  label,
  children,
  variant = "slate",
  size = "md",
  className = "",
  ...rest
}: BadgeProps) {
  const sizeStyles = {
    sm: "px-2 py-0.5",
    md: "px-2.5 py-1",
  }[size];

  const textSizeStyles = {
    sm: "text-xs",
    md: "text-xs font-semibold",
  }[size];

  const variantContainerStyles = {
    ocean: "bg-ocean/15",
    ocre: "bg-ocre/30",
    success: "bg-emerald-100",
    warning: "bg-amber-100",
    danger: "bg-red-100",
    slate: "bg-slate-200/70",
  }[variant];

  const variantTextStyles = {
    ocean: "text-ocean-dark font-nunito-bold",
    ocre: "text-ochre-dark font-nunito-bold",
    success: "text-emerald-800 font-nunito-bold",
    warning: "text-amber-800 font-nunito-bold",
    danger: "text-red-700 font-nunito-bold",
    slate: "text-slate-deep font-nunito-bold",
  }[variant];

  return (
    <View
      className={`self-start flex-row items-center justify-center rounded-full ${variantContainerStyles} ${sizeStyles} ${className}`}
      {...rest}
    >
      {label ? (
        <Text className={`${variantTextStyles} ${textSizeStyles}`}>
          {label}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
