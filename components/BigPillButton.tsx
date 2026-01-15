import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, radii, shadows, spacing } from '@/theme/Theme';

interface BigPillButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'white' | 'green' | 'purple';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function BigPillButton({
  title,
  onPress,
  variant = 'white',
  style,
  textStyle,
  disabled = false,
}: BigPillButtonProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'green':
        return colors.keepGreen;
      case 'purple':
        return colors.deletePurple;
      default:
        return colors.white;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'green':
      case 'purple':
        return colors.white;
      default:
        return colors.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        shadows.subtle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.bigPill,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  text: {
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
