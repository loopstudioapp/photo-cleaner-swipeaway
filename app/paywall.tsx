import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { colors, typography, spacing, radii } from '@/theme/Theme';
import BigPillButton from '@/components/BigPillButton';
import { usePurchases } from '@/context/PurchasesContext';
import { singularService } from '@/services/SingularService';

const features = [
  'Unlimited photo swiping',
  'Save photos to bookmarks',
  'Track your storage savings',
  'No ads, ever',
];

export default function PaywallScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { 
    weeklyPackage, 
    annualPackage, 
    purchasePackage, 
    restorePurchases,
    isLoading,
    isPurchasing,
    isRestoring,
    isPremium,
  } = usePurchases();
  
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'yearly'>('weekly');
  const [isTrialEnabled, setIsTrialEnabled] = useState(false);
  const isNavigatingRef = useRef(false);
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (isTrialEnabled) {
      setSelectedPlan('weekly');
    }
  }, [isTrialEnabled]);

  // Track paywall view on mount (only once)
  useEffect(() => {
    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true;
      singularService.trackPaywallView(source || 'unknown');
    }
  }, [source]);

  const navigateAfterPaywall = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    if (source === 'onboarding') {
      router.push('/permission');
    } else {
      // For swipe or any other source, go back to previous screen
      router.back();
    }
  };

  const handleClose = () => {
    navigateAfterPaywall();
  };

  const handleContinue = async () => {
    const packageToPurchase = selectedPlan === 'weekly' ? weeklyPackage : annualPackage;

    if (!packageToPurchase) {
      logger.log('[Paywall] No package available for selected plan');
      router.back();
      return;
    }

    try {
      await purchasePackage(packageToPurchase);
      logger.log('[Paywall] Purchase successful');

      // Note: Purchase events are sent to Singular automatically via RevenueCat integration
      // Do not track here to avoid double counting

      navigateAfterPaywall();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isCancelled = errorMessage.includes('cancelled') || errorMessage.includes('PURCHASE_CANCELLED');

      if (!isCancelled) {
        Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');

        // Track failed purchase (only if not cancelled by user)
        // Note: RevenueCat doesn't send failed purchases, so we track them client-side
        const productId = packageToPurchase.identifier;
        singularService.trackPurchaseFailed(productId, errorMessage);
      }

      logger.log('[Paywall] Purchase error:', error);
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      logger.log('[Paywall] Restore successful');
      navigateAfterPaywall();
    } catch (error) {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
      logger.log('[Paywall] Restore error:', error);
    }
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://loopstudio.tech/#terms');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://loopstudio.tech/#privacy');
  };

  const weeklyPrice = weeklyPackage?.product?.priceString || '$4.99';
  const annualPrice = annualPackage?.product?.priceString || '$29.99';

  const isProcessing = isPurchasing || isRestoring;


  const getButtonText = () => {
    if (selectedPlan === 'weekly') {
      return 'Try For $0.00';
    }
    return 'Continue';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isProcessing}>
              <X size={28} color={colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
              <Text style={styles.restoreText}>
                {isRestoring ? 'Restoring...' : 'Already purchased?'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Get Swiping!</Text>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.featureCheck}>
                  <Check size={14} color={colors.white} strokeWidth={3} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.textPrimary} />
            </View>
          ) : (
            <View style={styles.plansSection}>
              <TouchableOpacity
                style={[styles.trialToggleRow, isTrialEnabled && styles.trialToggleRowActive]}
                onPress={() => setIsTrialEnabled(!isTrialEnabled)}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                <View style={styles.trialToggleTextContainer}>
                  {isTrialEnabled ? (
                    <>
                      <Text style={styles.trialStatusTitle}>Free trial enabled</Text>
                      <Text style={styles.trialToggleSubtitle}>Cancel anytime.</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.trialToggleTitle}>Not sure yet?</Text>
                      <Text style={styles.trialToggleSubtitle}>Enable free trial</Text>
                    </>
                  )}
                </View>
                {isTrialEnabled ? (
                  <View style={styles.trialStatusCheckCircle}>
                    <Check size={16} color={colors.white} strokeWidth={3} />
                  </View>
                ) : (
                  <Switch
                    value={isTrialEnabled}
                    onValueChange={setIsTrialEnabled}
                    trackColor={{ false: '#E0E0E0', true: '#9B6CD1' }}
                    thumbColor={colors.white}
                    ios_backgroundColor="#E0E0E0"
                    disabled={isProcessing}
                  />
                )}
              </TouchableOpacity>

              {isTrialEnabled && (
                <View style={styles.dueTodayRow}>
                  <Text style={styles.dueTodayLeft}>Due today - $0.00</Text>
                  <Text style={styles.dueTodayRight}>3 days free</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'weekly' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('weekly')}
                disabled={isProcessing}
              >
                <View style={styles.centerBadge}>
                  <Text style={styles.centerBadgeText}>3 days free trial</Text>
                </View>
                <View style={styles.planCardContent}>
                  <View>
                    <Text style={[
                      styles.planName,
                      selectedPlan === 'weekly' && styles.planNameSelected,
                    ]}>Weekly</Text>
                    <Text style={[
                      styles.planPrice,
                      selectedPlan === 'weekly' && styles.planPriceSelected,
                    ]}>{weeklyPrice}/week</Text>
                  </View>
                  <View style={[
                    styles.planRadio,
                    selectedPlan === 'weekly' && styles.planRadioSelected,
                  ]}>
                    {selectedPlan === 'weekly' && (
                      <View style={styles.planRadioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'yearly' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('yearly')}
                disabled={isProcessing}
              >
                <View style={styles.centerBadgeBestValue}>
                  <Text style={styles.centerBadgeBestValueText}>Best Value</Text>
                </View>
                <View style={styles.planCardContent}>
                  <View>
                    <Text style={[
                      styles.planName,
                      selectedPlan === 'yearly' && styles.planNameSelected,
                    ]}>Yearly</Text>
                    <Text style={[
                      styles.planPrice,
                      selectedPlan === 'yearly' && styles.planPriceSelected,
                    ]}>{annualPrice}/year</Text>
                  </View>
                  <View style={[
                    styles.planRadio,
                    selectedPlan === 'yearly' && styles.planRadioSelected,
                  ]}>
                    {selectedPlan === 'yearly' && (
                      <View style={styles.planRadioInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {isPurchasing ? (
              <View style={styles.processingButton}>
                <ActivityIndicator size="small" color={colors.textPrimary} />
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            ) : (
              <BigPillButton
                title={getButtonText()}
                onPress={handleContinue}
                variant="white"
              />
            )}
          </View>

          <View style={styles.legalLinksContainer}>
            <TouchableOpacity onPress={handleOpenTerms}>
              <Text style={styles.termsText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>•</Text>
            <TouchableOpacity onPress={handleOpenPrivacy}>
              <Text style={styles.termsText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pinkPaywall,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  restoreText: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  title: {
    fontSize: typography.titleHeavy.fontSize,
    fontWeight: typography.titleHeavy.fontWeight,
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 52,
    letterSpacing: -1,
    marginTop: spacing.sm,
  },
  featuresContainer: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  featureCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.checkGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureText: {
    fontSize: typography.body.fontSize,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  plansSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  trialToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  trialToggleRowActive: {
    backgroundColor: 'rgba(155, 108, 209, 0.12)',
    borderWidth: 2,
    borderColor: '#9B6CD1',
  },
  trialToggleTextContainer: {
    flex: 1,
  },
  trialToggleTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  trialToggleSubtitle: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  trialStatusTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700' as const,
    color: '#9B6CD1',
  },
  trialStatusCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9B6CD1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueTodayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  dueTodayLeft: {
    fontSize: typography.small.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  dueTodayRight: {
    fontSize: typography.small.fontSize,
    fontWeight: '600' as const,
    color: '#9B6CD1',
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: radii.paywallToggle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 3,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: colors.textPrimary,
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: typography.body.fontSize,
    fontWeight: '700' as const,
    color: colors.textSecondary,
  },
  planNameSelected: {
    color: colors.textPrimary,
  },
  planPrice: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  planPriceSelected: {
    color: colors.textPrimary,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    borderColor: colors.textPrimary,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textPrimary,
  },
  centerBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#9B6CD1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.bigPill,
    zIndex: 1,
  },
  centerBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
  centerBadgeBestValue: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -40 }],
    backgroundColor: colors.checkGreen,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.bigPill,
    zIndex: 1,
  },
  centerBadgeBestValueText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  processingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.bigPill,
    gap: spacing.sm,
  },
  processingText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  legalSeparator: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  termsText: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
