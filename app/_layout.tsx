import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { AppProvider } from "@/context/AppContext";
import { PurchasesProvider } from "@/context/PurchasesContext";
import { singularService } from "@/services/SingularService";
import { logger } from "@/utils/logger";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
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
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      let attStatus: string | null = null;

      try {
        if (Platform.OS === "ios") {
          const current = await getTrackingPermissionsAsync();
          let status = current.status;

          if (status === "not-determined") {
            const requested = await requestTrackingPermissionsAsync();
            status = requested.status;
          }

          attStatus = status;
          logger.log("[RootLayout] ATT status:", status);
        }
      } catch (error) {
        logger.error("[RootLayout] ATT prompt failed", error);
      }

      // Initialize Singular MMP for TikTok ads tracking (after ATT)
      singularService.initialize();

      // Set ATT status as Singular user attribute (after initialization)
      if (attStatus && Platform.OS === "ios") {
        singularService.setUserAttribute("att_status", attStatus);
      }

      if (isMounted) {
        SplashScreen.hideAsync();
      }
    };

    init();

    return () => {
      isMounted = false;
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
