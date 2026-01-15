import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme/Theme';
import BigPillButton from '@/components/BigPillButton';
import PhotoGridCollage from '@/components/PhotoGridCollage';

export default function IntroGridScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/tutorial');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.gridContainer}>
            <PhotoGridCollage trashOverlays={[2, 5, 7]} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>
              CLEANUP YOUR{'\n'}CAMERA ROLL
            </Text>
            <Text style={styles.subtitle}>
              Go over your pictures, month by month,{'\n'}and only keep the ones you want.
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  gridContainer: {
    marginTop: spacing.xl,
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
