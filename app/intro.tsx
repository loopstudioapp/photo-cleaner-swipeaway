import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme/Theme';
import BigPillButton from '@/components/BigPillButton';
import PhotoGridCollage from '@/components/PhotoGridCollage';
import { requestTrackingPermissionOnce } from '@/services/TrackingPermissionService';
import { singularService } from '@/services/SingularService';

export default function IntroGridScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const maxGridSize = Math.min(width * 0.85, height * 0.35);

  const handleContinue = async () => {
    // Trigger ATT prompt and WAIT for user response before proceeding
    const status = await requestTrackingPermissionOnce(400);

    if (status && Platform.OS === 'ios') {
      singularService.setUserAttribute('att_status', status);
    }

    router.push('/tutorial');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.gridContainer}>
              <PhotoGridCollage trashOverlays={[2, 5, 7]} maxGridSize={maxGridSize} />
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
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.xl,
  },
  gridContainer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
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
    marginTop: spacing.md,
  },
});
