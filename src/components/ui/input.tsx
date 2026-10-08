import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  type TextInputProps,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? 'border-danger'
    : isFocused
    ? 'border-ocean'
    : 'border-slate-light/40';

  return (
    <View className={`w-full mb-3 ${containerClassName}`}>
      {label ? (
        <Text className="font-nunito-bold text-sm text-slate-deep mb-1.5">
          {label}
        </Text>
      ) : null}

      <View
        className={`flex-row items-center bg-white border ${borderColor} rounded-xl px-3.5 min-h-[48px]`}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

        <TextInput
          className={`flex-1 text-slate-deep font-source text-base py-2.5 ${className}`}
          placeholderTextColor="#94A3B8"
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />

        {rightIcon ? <View className="ml-2.5">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text className="font-source text-xs text-danger mt-1">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="font-source text-xs text-slate-mid mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
