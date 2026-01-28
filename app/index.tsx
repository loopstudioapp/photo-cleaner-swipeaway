import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/Theme';
import { useApp } from '@/context/AppContext';

export default function IndexScreen() {
  const router = useRouter();
  const { settings, isLoading } = useApp();

  useEffect(() => {
    if (isLoading) return;

    if (settings.hasCompletedOnboarding && settings.hasGrantedPhotoPermission) {
      // Returning user - Singular initializes in RootLayoutNav after ATT check
      router.replace('/home');
    } else {
      // New user - will go through onboarding
      // Singular will be initialized in intro.tsx AFTER ATT prompt
      router.replace('/intro');
    }
  }, [settings.hasCompletedOnboarding, settings.hasGrantedPhotoPermission, isLoading, router]);

  return (
    <View style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pinkBase,
  },
});
