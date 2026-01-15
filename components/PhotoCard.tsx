import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { colors, radii, shadows } from '@/theme/Theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

interface PhotoCardProps {
  uri: string;
  width?: number;
  height?: number;
  style?: any;
}

export default function PhotoCard({ uri, width: customWidth, height: customHeight, style }: PhotoCardProps) {
  const cardWidth = customWidth || CARD_WIDTH;
  const cardHeight = customHeight || CARD_HEIGHT;

  return (
    <View style={[styles.container, { width: cardWidth, height: cardHeight }, shadows.card, style]}>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.photoCard,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
