import React, { useState } from 'react';
import { logger } from '@/utils/logger';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme/Theme';
import { useApp } from '@/context/AppContext';
import BigPillButton from '@/components/BigPillButton';
import NotificationService from '@/services/NotificationService';

export default function NotificationsScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleContinue = async () => {
    logger.log('[NotificationsScreen] Requesting notification permission...');
    
    if (Platform.OS === 'web') {
      await completeOnboarding();
      router.replace('/home');
      return;
    }

    const notificationService = NotificationService.getInstance();
    const granted = await notificationService.requestPermission();

    logger.log('[NotificationsScreen] Permission granted:', granted);

    if (granted) {
      // Register background task for storage checks (weekly in prod, 5 min in debug)
      await notificationService.registerStorageCheckTask();
      await completeOnboarding();
      router.replace('/home');
    } else {
      setPermissionDenied(true);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Text style={styles.welcome}>clean-up</Text>
            <Text style={styles.title}>reminders</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.midSection}>
        <Text style={styles.description}>we&apos;ll let you know:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• when your camera roll is getting full</Text>
          <Text style={styles.bulletItem}>• weekly reminders to keep things tidy</Text>
        </View>
      </View>

      <View style={styles.lowSection}>
        <Text style={styles.instruction}>
          to get started, please{' '}
          <Text style={styles.bold}>enable notifications.</Text>
        </Text>
        {permissionDenied && (
          <Text style={styles.deniedText}>
            Notifications denied. You can enable them later in Settings.
          </Text>
        )}
      </View>

      <View style={styles.bottomSection}>
        <SafeAreaView edges={['bottom']} style={styles.buttonSafeArea}>
          <View style={styles.buttonContainer}>
            <BigPillButton
              title="Continue"
              onPress={handleContinue}
              variant="green"
              textStyle={styles.continueText}
            />
            {permissionDenied && (
              <Text style={styles.skipLink} onPress={handleSkip}>
                Skip for now
              </Text>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pinkLow,
  },
  topSection: {
    backgroundColor: colors.pinkHeader,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  welcome: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.white,
  },
  title: {
    fontSize: typography.logoHeavy.fontSize,
    fontWeight: typography.logoHeavy.fontWeight,
    color: colors.white,
    letterSpacing: -1,
  },
  midSection: {
    backgroundColor: colors.pinkMid,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  description: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 26,
  },
  bulletList: {
    marginTop: spacing.md,
  },
  bulletItem: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 28,
  },
  lowSection: {
    backgroundColor: colors.pinkLow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    flex: 1,
  },
  instruction: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 26,
  },
  bold: {
    fontWeight: '700',
  },
  deniedText: {
    fontSize: typography.small.fontSize,
    color: colors.deletePurple,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  bottomSection: {
    backgroundColor: colors.keepGreen,
    paddingTop: spacing.xl,
  },
  buttonSafeArea: {
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  continueText: {
    fontStyle: 'italic',
  },
  skipLink: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textDecorationLine: 'underline',
  },
});
