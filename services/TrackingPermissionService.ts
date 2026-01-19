import { Platform } from "react-native";
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { logger } from "@/utils/logger";

let requestPromise: Promise<string | null> | null = null;

/**
 * Request iOS ATT permission once. Safe to call from multiple places.
 * @param delayMs - optional delay before showing the system alert to avoid launch-time suppression
 */
export const requestTrackingPermissionOnce = async (delayMs: number = 0): Promise<string | null> => {
  if (Platform.OS !== "ios") return null;

  if (!requestPromise) {
    requestPromise = (async () => {
      try {
        const current = await getTrackingPermissionsAsync();
        let status = current.status;
        logger.log("[ATT] Current status:", status);

        if (status === "not-determined" || status === "undetermined") {
          if (delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
          const requested = await requestTrackingPermissionsAsync();
          status = requested.status;
        }

        logger.log("[ATT] Final status:", status);
        return status;
      } catch (error) {
        logger.error("[ATT] Prompt failed", error);
        // Reset promise to allow retry if something went wrong
        requestPromise = null;
        return null;
      }
    })();
  }

  return requestPromise;
};
