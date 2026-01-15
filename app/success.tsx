import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { colors, typography, spacing } from '@/theme/Theme';
import BigPillButton from '@/components/BigPillButton';

export default function SuccessScreen() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/paywall?source=onboarding');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.spacer} />
          
          <View style={styles.centerContent}>
            <Text style={styles.successText}>SUCCESS.</Text>
            
            <View style={styles.savedContainer}>
              <View style={styles.checkCircle}>
                <Check size={32} color={colors.white} strokeWidth={3} />
              </View>
              <Text style={styles.savedText}>400MB saved</Text>
            </View>
          </View>

          <View style={styles.bottomContent}>
            <Text style={styles.subtitle}>
              …AND ENJOY THE{'\n'}FREE SPACE
            </Text>

            <View style={styles.buttonContainer}>
              <BigPillButton
                title="Continue"
                onPress={handleContinue}
                variant="white"
              />
            </View>
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
    paddingHorizontal: spacing.xl,
  },
  spacer: {
    flex: 0.3,
  },
  centerContent: {
    alignItems: 'center',
  },
  successText: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  savedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.checkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  savedText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  subtitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    marginBottom: spacing.lg,
  },
});
