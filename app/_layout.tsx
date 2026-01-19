import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/context/AppContext";
import { PurchasesProvider } from "@/context/PurchasesContext";
import { singularService } from "@/services/SingularService";
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

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (initStartedRef.current) return;
      initStartedRef.current = true;

      // Initialize Singular MMP for TikTok ads tracking
      // Singular is configured to wait for ATT authorization (60s timeout)
      // ATT will be requested in intro.tsx and status will be set there
      singularService.initialize();

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
