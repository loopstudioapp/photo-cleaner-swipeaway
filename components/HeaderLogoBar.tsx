import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUpDown, Menu } from 'lucide-react-native';
import { colors, typography, spacing, iconSizes } from '@/theme/Theme';

interface HeaderLogoBarProps {
  onSortPress: () => void;
  onMenuPress: () => void;
}

export default function HeaderLogoBar({ onSortPress, onMenuPress }: HeaderLogoBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onSortPress} style={styles.iconButton}>
        <ArrowUpDown size={iconSizes.md} color={colors.textPrimary} strokeWidth={2.5} />
      </TouchableOpacity>
      
      <Text style={styles.logo}>SwipeAway</Text>
      
      <TouchableOpacity onPress={onMenuPress} style={styles.iconButton}>
        <Menu size={iconSizes.md} color={colors.textPrimary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: {
    fontSize: typography.logoHeavy.fontSize,
    fontWeight: typography.logoHeavy.fontWeight,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  iconButton: {
    padding: spacing.sm,
  },
});
