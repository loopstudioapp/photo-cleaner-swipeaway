import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, shadows } from '@/theme/Theme';

interface StampLabelProps {
  type: 'keep' | 'delete';
  rotation?: number;
  opacity?: number;
}

export default function StampLabel({ type, rotation = 0, opacity = 1 }: StampLabelProps) {
  const isKeep = type === 'keep';
  const borderColor = isKeep ? colors.keepGreen : colors.deletePurple;
  const textColor = isKeep ? colors.keepGreen : colors.deletePurple;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor,
          transform: [{ rotate: `${rotation}deg` }],
          opacity,
        },
        shadows.stamp,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {isKeep ? 'KEEP' : 'DELETE'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderWidth: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  text: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
