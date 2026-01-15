import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Trash2 } from 'lucide-react-native';
import { colors, radii, spacing } from '@/theme/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = SCREEN_WIDTH * 0.85;
const TILE_SIZE = (GRID_SIZE - spacing.sm * 2) / 3;

interface PhotoGridCollageProps {
  images?: string[];
  trashOverlays?: number[];
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400',
];

export default function PhotoGridCollage({ 
  images = PLACEHOLDER_IMAGES, 
  trashOverlays = [2, 5, 7] 
}: PhotoGridCollageProps) {
  const gridImages = images.length >= 9 ? images.slice(0, 9) : PLACEHOLDER_IMAGES;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {gridImages.map((uri, index) => (
          <View key={index} style={styles.tileWrapper}>
            <Image
              source={{ uri }}
              style={styles.tile}
              contentFit="cover"
              transition={200}
            />
            {trashOverlays.includes(index) && (
              <View style={styles.trashOverlay}>
                <View style={styles.trashIconContainer}>
                  <Trash2 size={20} color={colors.white} strokeWidth={2.5} />
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  grid: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tileWrapper: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  tile: {
    width: '100%',
    height: '100%',
  },
  trashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(180, 123, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashIconContainer: {
    backgroundColor: colors.deletePurple,
    borderRadius: 20,
    padding: 8,
  },
});
