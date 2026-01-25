import React, { useState } from 'react';
import { logger } from '@/utils/logger';
import { View, Text, StyleSheet, Platform, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import { colors, typography, spacing } from '@/theme/Theme';
import { useApp } from '@/context/AppContext';
import BigPillButton from '@/components/BigPillButton';

export default function PermissionScreen() {
  const router = useRouter();
  const { loadPhotos, updateSettings } = useApp();
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  const [isLimitedAccess, setIsLimitedAccess] = useState(false);

  const handleAllowAccess = async () => {
    logger.log('[PermissionScreen] Requesting photo access...');
    
    if (Platform.OS === 'web') {
      router.push('/notifications');
      return;
    }

    setIsRequesting(true);
    setPermissionDenied(false);
    setIsLimitedAccess(false);

    try {
      // First request read permission (this triggers the main photo access dialog)
      const readPermission = await MediaLibrary.requestPermissionsAsync(false);
      logger.log('[PermissionScreen] Read permission status:', readPermission.status, 'accessPrivileges:', readPermission.accessPrivileges);

      // Check if we have full access to all photos
      const hasFullAccess = readPermission.status === 'granted' && readPermission.accessPrivileges === 'all';
      const hasLimitedAccess = readPermission.status === 'granted' && readPermission.accessPrivileges === 'limited';

      if (hasFullAccess) {
        await updateSettings({ hasGrantedPhotoPermission: true });
        await loadPhotos();
        logger.log('[PermissionScreen] Full access granted, navigating to notifications');
        router.push('/notifications');
      } else if (hasLimitedAccess) {
        // User selected "Select Photos" (limited) instead of "Allow Access to All Photos"
        // Need full access to delete without individual prompts
        logger.log('[PermissionScreen] Limited access granted, need full access for deletion');
        setIsLimitedAccess(true);
      } else {
        logger.log('[PermissionScreen] Permission denied');
        setPermissionDenied(true);
      }
    } catch (error) {
      logger.error('[PermissionScreen] Error requesting permission:', error);
      setPermissionDenied(true);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Text style={styles.welcome}>welcome to</Text>
              <Text style={styles.title}>SwipeAway!</Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.midSection}>
          <Text style={styles.description}>
            SwipeAway helps you quickly organize your photo library by swiping through photos one at a time.
          </Text>
        </View>

        <View style={styles.lowSection}>
          <Text style={styles.instruction}>
            To get started, we need access to your photos. Tap below to allow access.
          </Text>
          {permissionDenied && (
            <Text style={styles.deniedMessage}>
              Photo access was denied. Please enable it in your device Settings to continue.
            </Text>
          )}
          {isLimitedAccess && (
            <Text style={styles.limitedMessage}>
              You selected &quot;Select Photos&quot; (limited access). To delete photos without individual prompts, please go to Settings → Privacy → Photos → SwipeAway and select &quot;All Photos&quot;.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <SafeAreaView edges={['bottom']} style={styles.buttonSafeArea}>
          <View style={styles.buttonContainer}>
            <BigPillButton
              title={isRequesting ? "Requesting..." : ((permissionDenied || isLimitedAccess) ? "Open Settings" : "Continue")}
              onPress={(permissionDenied || isLimitedAccess) ? handleOpenSettings : handleAllowAccess}
              variant="green"
            />
            <Text style={styles.privacyNote}>
              Your photos never leave your device.{'\n'}
              We take your privacy seriously.
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    color: colors.textPrimary,
  },
  title: {
    fontSize: typography.logoHeavy.fontSize,
    fontWeight: typography.logoHeavy.fontWeight,
    color: colors.textPrimary,
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
  lowSection: {
    backgroundColor: colors.pinkLow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    minHeight: 150,
  },
  instruction: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 26,
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
  privacyNote: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  deniedMessage: {
    fontSize: typography.small.fontSize,
    color: '#D32F2F',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  limitedMessage: {
    fontSize: typography.small.fontSize,
    color: '#E65100',
    marginTop: spacing.md,
    lineHeight: 20,
  },
});
