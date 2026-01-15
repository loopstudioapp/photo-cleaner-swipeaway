import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { 
  PurchasesPackage,
  LOG_LEVEL 
} from 'react-native-purchases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function getRCToken(): string {
  if (__DEV__ || Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '';
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || '',
  }) || '';
}

const rcToken = getRCToken();
if (rcToken) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: rcToken });
  console.log('[PurchasesContext] RevenueCat configured');
}

const PREMIUM_ENTITLEMENT = 'premium';

export const [PurchasesProvider, usePurchases] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isPremium, setIsPremium] = useState(false);

  const offeringsQuery = useQuery({
    queryKey: ['rc-offerings'],
    queryFn: async () => {
      try {
        console.log('[PurchasesContext] Fetching offerings...');
        const offerings = await Purchases.getOfferings();
        console.log('[PurchasesContext] Offerings:', offerings.current?.identifier);
        return offerings;
      } catch (error) {
        console.error('[PurchasesContext] Error fetching offerings:', error);
        throw error;
      }
    },
    enabled: !!rcToken,
    staleTime: 1000 * 60 * 5,
  });

  const customerInfoQuery = useQuery({
    queryKey: ['rc-customer-info'],
    queryFn: async () => {
      try {
        console.log('[PurchasesContext] Fetching customer info...');
        const info = await Purchases.getCustomerInfo();
        console.log('[PurchasesContext] Customer info:', info.entitlements.active);
        return info;
      } catch (error) {
        console.error('[PurchasesContext] Error fetching customer info:', error);
        throw error;
      }
    },
    enabled: !!rcToken,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (customerInfoQuery.data) {
      const hasPremium = !!customerInfoQuery.data.entitlements.active[PREMIUM_ENTITLEMENT];
      setIsPremium(hasPremium);
      console.log('[PurchasesContext] Premium status:', hasPremium);
    }
  }, [customerInfoQuery.data]);

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasesPackage) => {
      console.log('[PurchasesContext] Purchasing package:', packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      const hasPremium = !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
      setIsPremium(hasPremium);
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
      console.log('[PurchasesContext] Purchase successful, premium:', hasPremium);
    },
    onError: (error) => {
      console.error('[PurchasesContext] Purchase error:', error);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log('[PurchasesContext] Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      const hasPremium = !!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT];
      setIsPremium(hasPremium);
      queryClient.invalidateQueries({ queryKey: ['rc-customer-info'] });
      console.log('[PurchasesContext] Restore successful, premium:', hasPremium);
    },
    onError: (error) => {
      console.error('[PurchasesContext] Restore error:', error);
    },
  });

  const currentOffering = offeringsQuery.data?.current;
  const weeklyPackage = currentOffering?.availablePackages.find(
    p => p.packageType === 'WEEKLY' || p.identifier === '$rc_weekly'
  );
  const annualPackage = currentOffering?.availablePackages.find(
    p => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual'
  );

  const { mutateAsync: purchasePackageAsync } = purchaseMutation;
  const { mutateAsync: restoreAsync } = restoreMutation;

  const purchasePackage = useCallback(async (pkg: PurchasesPackage) => {
    return purchasePackageAsync(pkg);
  }, [purchasePackageAsync]);

  const restorePurchases = useCallback(async () => {
    return restoreAsync();
  }, [restoreAsync]);

  return {
    isPremium,
    isLoading: offeringsQuery.isLoading || customerInfoQuery.isLoading,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    currentOffering,
    weeklyPackage,
    annualPackage,
    purchasePackage,
    restorePurchases,
    purchaseError: purchaseMutation.error,
    restoreError: restoreMutation.error,
  };
});
