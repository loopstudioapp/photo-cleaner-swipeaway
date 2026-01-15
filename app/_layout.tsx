import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/context/AppContext";
import { PurchasesProvider } from "@/context/PurchasesContext";

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
    SplashScreen.hideAsync();
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
