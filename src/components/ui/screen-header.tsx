import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightElement,
  className = '',
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 16) }}
      className={`bg-surface px-4 pb-3 border-b border-slate-light/20 ${className}`}
    >
      <View className="flex-row items-center justify-between min-h-[44px]">
        <View className="flex-row items-center flex-1">
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Volver"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="min-w-[44px] min-h-[44px] justify-center items-start active:opacity-70 mr-1"
            >
              <SymbolView
                name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
                size={22}
                weight="bold"
                tintColor="#1E293B"
              />
            </Pressable>
          ) : null}

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="font-nunito-bold text-slate-deep text-xl"
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                className="font-source text-slate-mid text-xs mt-0.5"
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {rightElement ? (
          <View className="ml-3 flex-row items-center justify-end">
            {rightElement}
          </View>
        ) : null}
      </View>
    </View>
  );
}
