import React from "react";
import {
  Pressable,
  View,
  type PressableProps,
  type ViewProps,
} from "react-native";

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Card({
  children,
  className = "",
  onPress,
  accessibilityLabel,
  ...rest
}: CardProps) {
  const baseStyles = "bg-card rounded-2xl p-4 border border-slate-light/25";

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={`${baseStyles} active:opacity-90 active:scale-[0.99] ${className}`}
        {...(rest as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className={`${baseStyles} ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
