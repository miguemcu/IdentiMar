import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  View,
} from 'react-native';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  onPress,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyles = 'flex-row items-center justify-center rounded-xl';

  const sizeStyles = {
    sm: 'min-h-[44px] px-3 py-2',
    md: 'min-h-[48px] px-5 py-3',
    lg: 'min-h-[56px] px-6 py-4',
  }[size];

  const variantStyles = {
    primary: 'bg-ocean active:bg-ocean-dark',
    secondary: 'bg-ocre active:bg-ocre-dark',
    outline: 'bg-transparent border border-ocean active:bg-ocean-light/20',
    ghost: 'bg-transparent active:bg-slate-light/20',
    danger: 'bg-danger active:opacity-90',
  }[variant];

  const textVariantStyles = {
    primary: 'text-white font-nunito-bold',
    secondary: 'text-slate-deep font-nunito-bold',
    outline: 'text-ocean font-nunito-bold',
    ghost: 'text-slate-deep font-nunito-semibold',
    danger: 'text-white font-nunito-bold',
  }[variant];

  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[size];

  const spinnerColor = {
    primary: '#FFFFFF',
    secondary: '#1E293B',
    outline: '#0284C7',
    ghost: '#1E293B',
    danger: '#FFFFFF',
  }[variant];

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${
        isDisabled ? 'opacity-50' : 'active:scale-[0.98]'
      } ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          {title ? (
            <Text className={`${textVariantStyles} ${textSizeStyles}`}>
              {title}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
}
