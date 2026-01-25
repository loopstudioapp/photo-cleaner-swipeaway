import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme/Theme';
import BigPillButton from '@/components/BigPillButton';
import PhotoCard from '@/components/PhotoCard';
import StampLabel from '@/components/StampLabel';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function TutorialScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/success');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.cardContainer}>
              <PhotoCard
                uri={PLACEHOLDER_IMAGE}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
              />
              <View style={styles.stampOverlay}>
                <StampLabel type="keep" rotation={-12} />
              </View>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>
                SWIPE THROUGH{'\n'}YOUR PHOTOS…
              </Text>
              <Text style={styles.subtitle}>
                Swipe right to keep, left to delete.{'\n'}
                It is that simple.
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <BigPillButton
                title="Continue"
                onPress={handleContinue}
                variant="white"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pinkBase,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    minHeight: 600,
  },
  cardContainer: {
    marginTop: spacing.xxl,
    position: 'relative',
  },
  stampOverlay: {
    position: 'absolute',
    top: 30,
    left: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.titleHeavy.fontSize,
    fontWeight: typography.titleHeavy.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 26,
  },
  buttonContainer: {
    paddingBottom: spacing.xl,
  },
});
