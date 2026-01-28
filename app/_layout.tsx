import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/context/AppContext";
import { PurchasesProvider } from "@/context/PurchasesContext";
import { singularService } from "@/services/SingularService";
import { requestTrackingPermissionOnce } from "@/services/TrackingPermissionService";
import { logger } from "@/utils/logger";

// Configure notification handler for local notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const { settings, isLoading } = useApp();
  const singularInitializedRef = useRef(false);

  // Returning users: initialize Singular after ATT check (if needed)
  useEffect(() => {
    if (isLoading) return;
    if (!settings.hasCompletedOnboarding) return;
    if (singularInitializedRef.current) return;

    const initReturningUser = async () => {
      try {
        if (Platform.OS === 'ios') {
          logger.log('[RootLayout] Returning user - checking ATT before init');
          const attStatus = await requestTrackingPermissionOnce(0);
          if (attStatus) {
            singularService.setUserAttribute('att_status', attStatus);
          }
        }

        singularService.initialize();
        singularInitializedRef.current = true;
        logger.log('[RootLayout] Singular initialized for returning user');
      } catch (error) {
        logger.error('[RootLayout] Returning user init failed:', error);
      }
    };

    initReturningUser();
  }, [isLoading, settings.hasCompletedOnboarding]);

  useEffect(() => {
    // Handle notification tap when app is in foreground or background
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      logger.log('[RootLayout] Notification tapped:', data);

      // Navigate to home when storage notification is tapped
      if (data?.type === 'low_space_alert') {
        router.push('/home');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="intro" />
      <Stack.Screen name="tutorial" />
      <Stack.Screen name="success" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="permission" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="home" />
      <Stack.Screen name="menu" options={{ presentation: "modal" }} />
      <Stack.Screen name="swipe" />
      <Stack.Screen name="bookmarks" options={{ presentation: "modal" }} />
      <Stack.Screen name="stats" options={{ presentation: "modal" }} />
      <Stack.Screen name="faq" options={{ presentation: "modal" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const initStartedRef = useRef(false);
  const notificationCheckedRef = useRef(false);
  const singularInitStartedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (initStartedRef.current) return;
      initStartedRef.current = true;

      // Initialize Singular early ONLY if app opened via attribution deep link
      // This keeps attribution for ad deep links while avoiding tracking for users
      // who haven't completed onboarding yet.
      if (!singularInitStartedRef.current && Platform.OS !== "web") {
        try {
          const initialUrl = await Linking.getInitialURL();

          // Only init for Singular attribution links (swipeaway.sng.link)
          // Ignore custom schemes (rork-app://) and organic shares
          const isAttributionLink = initialUrl && initialUrl.includes('sng.link');

          if (isAttributionLink) {
            singularInitStartedRef.current = true;
            logger.log("[RootLayout] Attribution deep link detected, early Singular init:", initialUrl);

            // SDK waits up to 60s for ATT, but won't block app launch
            singularService.initialize();
          } else {
            logger.log("[RootLayout] No attribution link, skipping early Singular init");
          }
        } catch (error) {
          logger.error("[RootLayout] Deep link check failed:", error);
        }
      }

      // Check if app was opened from a notification (when app was killed)
      if (!notificationCheckedRef.current && Platform.OS !== "web") {
        notificationCheckedRef.current = true;
        try {
          const response = await Notifications.getLastNotificationResponseAsync();
          if (response?.notification.request.content.data?.type === 'low_space_alert') {
            logger.log("[RootLayout] App opened from notification");
            // The router navigation will be handled in RootLayoutNav after navigation is ready
          }
        } catch (error) {
          logger.error("[RootLayout] Error checking last notification:", error);
        }
      }

      if (isMounted) {
        SplashScreen.hideAsync();
      }
    };

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === "active") {
        init();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // If app is already active (cold start), trigger immediately
    if (AppState.currentState === "active") {
      init();
    }

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
            <PurchasesProvider>
              <RootLayoutNav />
            </PurchasesProvider>
          </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
