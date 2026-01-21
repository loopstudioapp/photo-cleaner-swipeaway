import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-task';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';

const LOW_SPACE_ALERT_TYPE = 'low_space_alert';
const STORAGE_CHECK_TASK = 'app.swipeaway.storageCheck'; // Must match BGTaskSchedulerPermittedIdentifiers

const ONE_WEEK_IN_MINUTES = 60 * 24 * 7;
const DEBUG_INTERVAL_MINUTES = 2; // 2 minutes for testing
const STORAGE_WARNING_COOLDOWN_MS = __DEV__ ? 1 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 min in dev, 24h in prod
const LOW_SPACE_PERCENT_THRESHOLD = __DEV__ ? 0.9 : 0.1; // 90% in dev, 10% in prod
const LOW_SPACE_MIN_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB absolute threshold
const STORAGE_NOTIFICATION_TITLE = 'Storage almost full';
const STORAGE_NOTIFICATION_BODY = "You're low on free space. Open the app to clean photos.";
const LAST_STORAGE_WARN_AT_KEY = '@swipeaway_last_storage_warn_at';
const IS_DEBUG = __DEV__; // Use Expo's __DEV__ flag

class NotificationService {
  private static instance: NotificationService;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      logger.log('[NotificationService] Web platform - skipping permission request');
      return true;
    }

    try {
      logger.log('[NotificationService] Checking existing permission status...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      logger.log('[NotificationService] Existing status:', existingStatus);
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        logger.log('[NotificationService] Requesting notification permission...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        logger.log('[NotificationService] Permission request result:', status);
      }

      logger.log('[NotificationService] Final permission status:', finalStatus);
      return finalStatus === 'granted';
    } catch (error) {
      logger.error('[NotificationService] Error requesting permission:', error);
      return false;
    }
  }

  async getStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    if (Platform.OS === 'web') {
      return 'granted';
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      logger.error('[NotificationService] Error getting status:', error);
      return 'undetermined';
    }
  }

  private async getFreeDiskBytes(): Promise<number | null> {
    if (Platform.OS === 'web') return null;

    try {
      logger.log('[NotificationService] 📊 Reading free disk space...');
      const freeBytes = await FileSystem.getFreeDiskStorageAsync();
      logger.log('[NotificationService] Free bytes:', freeBytes, '=', (freeBytes / 1024 / 1024 / 1024).toFixed(2), 'GB');
      return freeBytes ?? null;
    } catch (error) {
      logger.error('[NotificationService] Error reading free disk space:', error);
      return null;
    }
  }

  private async getTotalDiskBytes(): Promise<number | null> {
    try {
      logger.log('[NotificationService] 📊 Reading total disk capacity...');
      const totalBytes = await FileSystem.getTotalDiskCapacityAsync();
      logger.log('[NotificationService] Total bytes:', totalBytes, '=', (totalBytes / 1024 / 1024 / 1024).toFixed(2), 'GB');
      return totalBytes ?? null;
    } catch (error) {
      logger.error('[NotificationService] Error reading total disk capacity:', error);
      return null;
    }
  }

  private async isLowOnSpace(): Promise<boolean> {
    logger.log('[NotificationService] 🔍 Checking if low on space...');

    const freeBytes = await this.getFreeDiskBytes();
    if (freeBytes == null || freeBytes <= 0) {
      logger.log('[NotificationService] ❌ Free disk bytes unavailable; skipping low-space determination');
      return false;
    }

    const totalBytes = await this.getTotalDiskBytes();

    // Calculate percentage
    const percentUsed = totalBytes != null && totalBytes > 0
      ? ((totalBytes - freeBytes) / totalBytes) * 100
      : 0;
    const percentFree = totalBytes != null && totalBytes > 0
      ? (freeBytes / totalBytes) * 100
      : 0;

    // Check thresholds
    const meetsPercentThreshold =
      totalBytes != null && totalBytes > 0
        ? freeBytes / totalBytes <= LOW_SPACE_PERCENT_THRESHOLD
        : false;
    const meetsAbsoluteThreshold = freeBytes <= LOW_SPACE_MIN_BYTES;

    logger.log('[NotificationService] ═════════ DISK SPACE ANALYSIS ═════════');
    logger.log('[NotificationService] Free:', (freeBytes / 1024 / 1024 / 1024).toFixed(2), 'GB');
    logger.log('[NotificationService] Total:', totalBytes ? (totalBytes / 1024 / 1024 / 1024).toFixed(2) : 'unknown', 'GB');
    logger.log('[NotificationService] Used:', percentUsed.toFixed(1), '%');
    logger.log('[NotificationService] Free:', percentFree.toFixed(1), '%');
    logger.log('[NotificationService] ─────────────────────────────────────');
    logger.log('[NotificationService] Percent threshold:', (LOW_SPACE_PERCENT_THRESHOLD * 100), '% (trigger when free <=', (LOW_SPACE_PERCENT_THRESHOLD * 100) + '%)');
    logger.log('[NotificationService] Absolute threshold:', (LOW_SPACE_MIN_BYTES / 1024 / 1024 / 1024).toFixed(2), 'GB');
    logger.log('[NotificationService] ─────────────────────────────────────');
    logger.log('[NotificationService] Meets percent threshold?', meetsPercentThreshold, percentFree <= (LOW_SPACE_PERCENT_THRESHOLD * 100) ? '✅' : '❌');
    logger.log('[NotificationService] Meets absolute threshold?', meetsAbsoluteThreshold, freeBytes <= LOW_SPACE_MIN_BYTES ? '✅' : '❌');
    logger.log('[NotificationService] 🎯 Result:', (meetsPercentThreshold || meetsAbsoluteThreshold) ? '⚠️ LOW ON SPACE!' : '✅ Space OK');
    logger.log('[NotificationService] ═════════════════════════════════════');

    return meetsPercentThreshold || meetsAbsoluteThreshold;
  }

  private async canSendStorageWarning(now: number): Promise<boolean> {
    try {
      const lastWarnRaw = await AsyncStorage.getItem(LAST_STORAGE_WARN_AT_KEY);
      logger.log('[NotificationService] Last warning timestamp (raw):', lastWarnRaw);

      if (lastWarnRaw) {
        const lastWarn = Number.parseInt(lastWarnRaw, 10);
        const timeSinceLastWarn = now - lastWarn;
        const cooldownRemaining = STORAGE_WARNING_COOLDOWN_MS - timeSinceLastWarn;

        logger.log('[NotificationService] Time since last warning:', timeSinceLastWarn, 'ms');
        logger.log('[NotificationService] Cooldown period:', STORAGE_WARNING_COOLDOWN_MS, 'ms');
        logger.log('[NotificationService] Cooldown remaining:', cooldownRemaining, 'ms');

        if (!Number.isNaN(lastWarn) && timeSinceLastWarn < STORAGE_WARNING_COOLDOWN_MS) {
          logger.log('[NotificationService] Storage warning skipped due to cooldown window');
          return false;
        }
      } else {
        logger.log('[NotificationService] No previous warning found - can send');
      }
    } catch (error) {
      logger.error('[NotificationService] Failed to read storage warning timestamp:', error);
    }

    logger.log('[NotificationService] Cooldown check passed - can send warning');
    return true;
  }

  private async recordStorageWarning(now: number): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_STORAGE_WARN_AT_KEY, now.toString());
    } catch (error) {
      logger.error('[NotificationService] Failed to persist storage warning timestamp:', error);
    }
  }

  private async sendLowStorageNotification(): Promise<void> {
    logger.log('[NotificationService] 🔔 Sending low storage notification...');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: STORAGE_NOTIFICATION_TITLE,
        body: STORAGE_NOTIFICATION_BODY,
        data: {
          type: LOW_SPACE_ALERT_TYPE,
          isLowOnSpace: true,
          url: 'rork-app://home', // Deep link to open app
        },
      },
      trigger: null,
    });
    logger.log('[NotificationService] ✅ Low storage notification scheduled successfully');
  }

  async runStorageCheck(trigger: 'manual' | 'foreground' | 'background' = 'manual'): Promise<boolean> {
    if (Platform.OS === 'web') {
      logger.log('[NotificationService] Web platform - skipping storage check');
      return false;
    }

    logger.log(`[NotificationService] ═══════════════════════════════════`);
    logger.log(`[NotificationService] 🔍 Starting storage check (trigger: ${trigger})`);
    logger.log(`[NotificationService] ═══════════════════════════════════`);

    try {
      logger.log('[NotificationService] Step 1: Checking notification permission...');
      const { status } = await Notifications.getPermissionsAsync();
      logger.log('[NotificationService] Permission status:', status);

      if (status !== 'granted') {
        logger.log('[NotificationService] ❌ Notifications not granted; skipping storage check');
        return false;
      }
      logger.log('[NotificationService] ✅ Notifications granted');

      logger.log('[NotificationService] Step 2: Checking disk space...');
      const isLowOnSpace = await this.isLowOnSpace();
      logger.log('[NotificationService] Low on space?', isLowOnSpace);

      if (!isLowOnSpace) {
        logger.log('[NotificationService] ✅ Disk space OK; no storage alert needed');
        return false;
      }
      logger.log('[NotificationService] ⚠️ Low disk space detected!');

      logger.log('[NotificationService] Step 3: Checking cooldown...');
      const now = Date.now();
      const canSend = await this.canSendStorageWarning(now);

      if (!canSend) {
        logger.log('[NotificationService] ❌ Cannot send - cooldown active');
        return false;
      }
      logger.log('[NotificationService] ✅ Cooldown check passed');

      logger.log('[NotificationService] Step 4: Sending notification...');
      await this.sendLowStorageNotification();
      await this.recordStorageWarning(now);

      logger.log(`[NotificationService] ✅ Low-storage alert scheduled (${trigger})`);
      logger.log(`[NotificationService] ═══════════════════════════════════`);
      return true;
    } catch (error) {
      logger.error(`[NotificationService] ❌ Error during storage check (${trigger}):`, error);
      return false;
    }
  }

  async registerStorageCheckTask(options: { force?: boolean } = {}): Promise<void> {
    if (Platform.OS === 'web') {
      logger.log('[NotificationService] Web platform - skipping task registration');
      return;
    }
    const { force = false } = options;

    logger.log('[NotificationService] ═══════════════════════════════════');
    logger.log('[NotificationService] 📋 Registering BGTaskScheduler...');
    logger.log('[NotificationService] iOS Version:', Platform.Version);
    logger.log('[NotificationService] ═══════════════════════════════════');

    if (!STORAGE_TASK_DEFINED) {
      logger.log('[NotificationService] ❌ Storage background task not defined; skipping registration');
      return;
    }
    logger.log('[NotificationService] ✅ Task definition confirmed');

    try {
      logger.log('[NotificationService] Checking if task already registered...');
      const isRegistered = await TaskManager.isTaskRegisteredAsync(STORAGE_CHECK_TASK);
      logger.log('[NotificationService] Already registered?', isRegistered);

      if (isRegistered) {
        if (!force) {
          logger.log('[NotificationService] ✅ Storage background task already registered - skipping');
          return;
        }

        logger.log('[NotificationService] ⚠️ Storage background task already registered');
        logger.log('[NotificationService] Force mode: unregistering old task first...');
        await TaskManager.unregisterTaskAsync(STORAGE_CHECK_TASK);
        logger.log('[NotificationService] ✅ Old task unregistered');
      }

      const interval = IS_DEBUG ? DEBUG_INTERVAL_MINUTES : ONE_WEEK_IN_MINUTES;
      logger.log('[NotificationService] Configuration:');
      logger.log('[NotificationService] - Task ID:', STORAGE_CHECK_TASK);
      logger.log('[NotificationService] - API: BGTaskScheduler (iOS 13+)');
      logger.log('[NotificationService] - Debug mode:', IS_DEBUG);
      logger.log('[NotificationService] - Interval:', interval, 'minutes');
      logger.log('[NotificationService] - Cooldown:', STORAGE_WARNING_COOLDOWN_MS, 'ms =', STORAGE_WARNING_COOLDOWN_MS / 60000, 'minutes');
      logger.log('[NotificationService] - Low space threshold:', LOW_SPACE_PERCENT_THRESHOLD * 100, '%');

      logger.log('[NotificationService] Calling BackgroundTask.registerTaskAsync...');
      await BackgroundTask.registerTaskAsync(STORAGE_CHECK_TASK, {
        minimumInterval: interval,
      });

      logger.log(`[NotificationService] ✅ BGTaskScheduler registered successfully!`);
      logger.log('[NotificationService] ═══════════════════════════════════');

      // Verify registration
      const nowRegistered = await TaskManager.isTaskRegisteredAsync(STORAGE_CHECK_TASK);
      logger.log('[NotificationService] 🔍 Verification: Task registered?', nowRegistered, nowRegistered ? '✅' : '❌');
    } catch (error) {
      logger.error('[NotificationService] ❌ Failed to register BGTaskScheduler:', error);
      logger.error('[NotificationService] Error details:', error);
    }
  }

}

const STORAGE_TASK_DEFINED = defineStorageTask();

function defineStorageTask(): boolean {
  if (Platform.OS === 'web') return false;

  try {
    if (TaskManager.isTaskDefined?.(STORAGE_CHECK_TASK)) {
      return true;
    }

    TaskManager.defineTask(STORAGE_CHECK_TASK, async () => {
      try {
        logger.log('[NotificationService] ═══════════════════════════════════');
        logger.log('[NotificationService] 🔄 Background task triggered (BGTask)!');
        logger.log('[NotificationService] Timestamp:', new Date().toISOString());
        logger.log('[NotificationService] ═══════════════════════════════════');

        const service = NotificationService.getInstance();

        // Run storage check and send alert if needed
        logger.log('[NotificationService] Running storage check...');
        const sent = await service.runStorageCheck('background');

        logger.log('[NotificationService] Storage check result:', sent ? 'NOTIFICATION SENT' : 'NO NOTIFICATION');
        logger.log('[NotificationService] ═══════════════════════════════════');

        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        logger.error('[NotificationService] ❌ Storage background task error:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('already defined')) {
      return true;
    }

    logger.error('[NotificationService] Failed to define storage background task:', error);
    return false;
  }
}

export default NotificationService;
