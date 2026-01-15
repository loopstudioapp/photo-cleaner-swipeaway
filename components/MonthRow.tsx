import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { monthColors, colors, typography, radii, spacing } from '@/theme/Theme';

interface MonthRowProps {
  label: string;
  photoCount: number;
  onPress: () => void;
}

export default function MonthRow({ label, photoCount, onPress }: MonthRowProps) {
  const colorScheme = monthColors[label] || { bg: colors.pinkMonthFallback, text: colors.textPrimary };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, { backgroundColor: colorScheme.bg }]}
    >
      <View style={styles.content}>
        <Text style={[styles.label, { color: colorScheme.text }]}>{label}</Text>
        <View style={styles.rightSection}>
          <Text style={[styles.count, { color: colorScheme.text }]}>{photoCount}</Text>
          <ChevronRight size={24} color={colorScheme.text} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    height: 64,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
});
