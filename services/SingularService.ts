import { Platform } from 'react-native';
import { Singular, SingularConfig } from 'singular-react-native';
import { logger } from '@/utils/logger';
import Constants from 'expo-constants';

/**
 * Singular MMP Service for TikTok Ads Tracking
 *
 * Events tracked:
 * - App Install (automatic via Singular SDK)
 * - Paywall Views
 * - Purchase Success/Failed
 * - Photo Keep/Delete actions
 * - Session Complete
 */

class SingularService {
  private isInitialized = false;
  private isEnabled = false;

  /**
   * Initialize Singular SDK
   * Call this once at app startup (in _layout.tsx)
   */
  initialize(): void {
    if (this.isInitialized) {
      logger.log('[SingularService] Already initialized');
      return;
    }

    // Get API credentials from environment
    const extra = Constants.expoConfig?.extra;
    const singular = extra?.singular || {};

    const apiKey = Platform.select({
      ios: singular.iosApiKey || process.env.EXPO_PUBLIC_SINGULAR_IOS_API_KEY,
      android: singular.androidApiKey || process.env.EXPO_PUBLIC_SINGULAR_ANDROID_API_KEY,
    });
    const apiSecret = Platform.select({
      ios: singular.iosSecret || process.env.EXPO_PUBLIC_SINGULAR_IOS_SECRET,
      android: singular.androidSecret || process.env.EXPO_PUBLIC_SINGULAR_ANDROID_SECRET,
    });

    const enableLogsFlag =
      Constants.expoConfig?.extra?.singular?.enableLogs === true ||
      process.env.EXPO_PUBLIC_ENABLE_SINGULAR_LOGS === 'true';

    // Force one error-level log so it shows up in TestFlight/production device logs
    logger.log('[SingularService] Init status', {
      platform: Platform.OS,
      hasKey: !!apiKey,
      hasSecret: !!apiSecret,
      enableLogsFlag,
      dev: __DEV__,
    });

    // Skip initialization if no credentials (web or missing config)
    if (!apiKey || !apiSecret || Platform.OS === 'web') {
      logger.log('[SingularService] Skipping initialization (no credentials or web platform)');
      this.isInitialized = true;
      this.isEnabled = false;
      return;
    }

    try {
      logger.log('[SingularService] Initializing with config:', {
        platform: Platform.OS,
        debug: __DEV__,
      });

      const config = new SingularConfig(apiKey, apiSecret);
      config.withSessionTimeoutInSec(60); // 60 seconds session timeout

      // Enable SKAdNetwork (required for iOS attribution)
      config.skAdNetworkEnabled = true;

      // Wait for ATT authorization before sending first session (iOS 14.5+)
      // ATT prompt is shown in _layout.tsx before Singular init
      config.waitForTrackingAuthorizationWithTimeoutInterval = 60; // 60 seconds timeout

      if (__DEV__ || enableLogsFlag) {
        config.withLoggingEnabled();
      }

      Singular.init(config);
      this.isInitialized = true;
      this.isEnabled = true;
      logger.log('[SingularService] Initialized successfully');
    } catch (error) {
      logger.error('[SingularService] Initialization failed:', error);
      this.isInitialized = true;
      this.isEnabled = false;
    }

    // Best-effort Device ID log for dashboard search; do not fail init if unsupported
    if (this.isEnabled) {
      try {
        const getDeviceId = (Singular as any)?.getDeviceId;
        if (typeof getDeviceId === 'function') {
          getDeviceId((deviceId: string) => {
            logger.log('[SingularService] Device ID', deviceId);
          });
        } else {
          logger.log('[SingularService] Device ID lookup not available in SDK version');
        }
      } catch (error) {
        logger.error('[SingularService] Device ID lookup failed', error);
      }
    }
  }

  /**
   * Track custom event
   * @private
   */
  private trackEvent(eventName: string, attributes?: Record<string, string | number | boolean>): void {
    if (!this.isEnabled) {
      logger.log(`[SingularService] Event skipped (disabled): ${eventName}`, attributes);
      return;
    }

    try {
      if (attributes) {
        Singular.eventWithArgs(eventName, attributes);
        logger.log(`[SingularService] Event tracked: ${eventName}`, attributes);
      } else {
        Singular.event(eventName);
        logger.log(`[SingularService] Event tracked: ${eventName}`);
      }
    } catch (error) {
      logger.error(`[SingularService] Failed to track event: ${eventName}`, error);
    }
  }

  /**
   * Track paywall view
   * @param source - Where the paywall was triggered from (e.g., 'swipe', 'onboarding')
   */
  trackPaywallView(source: string): void {
    this.trackEvent('paywall_view', { source });
  }

  /**
   * Track successful purchase
   * @param productId - The product/package identifier
   * @param revenue - Purchase amount in USD
   * @param currency - Currency code (default: 'USD')
   */
  trackPurchase(productId: string, revenue: number, currency: string = 'USD'): void {
    this.trackEvent('purchase_success', {
      product_id: productId,
      revenue,
      currency,
    });
  }

  /**
   * Track failed purchase
   * @param productId - The product/package identifier
   * @param reason - Failure reason
   */
  trackPurchaseFailed(productId: string, reason: string): void {
    this.trackEvent('purchase_failed', {
      product_id: productId,
      reason,
    });
  }

  /**
   * Track photo keep action (swipe right)
   * @param photoCount - Number of photos kept in this action
   */
  trackPhotoKeep(photoCount: number = 1): void {
    this.trackEvent('photo_keep', { count: photoCount });
  }

  /**
   * Track photo delete action (swipe left)
   * @param photoCount - Number of photos deleted in this action
   */
  trackPhotoDelete(photoCount: number = 1): void {
    this.trackEvent('photo_delete', { count: photoCount });
  }

  /**
   * Track swipe session completion
   * @param photosReviewed - Total photos reviewed in session
   * @param photosDeleted - Total photos deleted in session
   * @param spaceSaved - Space saved in bytes
   */
  trackSessionComplete(
    photosReviewed: number,
    photosDeleted: number,
    spaceSaved: number
  ): void {
    this.trackEvent('session_complete', {
      photos_reviewed: photosReviewed,
      photos_deleted: photosDeleted,
      space_saved_mb: Math.round(spaceSaved / 1024 / 1024),
    });
  }

  /**
   * Set custom user attribute
   * @param key - Attribute key
   * @param value - Attribute value
   */
  setUserAttribute(key: string, value: string): void {
    if (!this.isEnabled) return;

    try {
      // Use setGlobalProperty for custom attributes (not setCustomUserId)
      Singular.setGlobalProperty(key, value, true); // true = overwrite if exists
      logger.log(`[SingularService] User attribute set: ${key} = ${value}`);
    } catch (error) {
      logger.error('[SingularService] Failed to set user attribute:', error);
    }
  }
}

// Export singleton instance
export const singularService = new SingularService();
