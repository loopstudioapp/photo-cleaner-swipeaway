import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { logger } from '@/utils/logger';

const LOW_SPACE_ALERT_TYPE = 'low_space_alert';
const TEST_NOTIFICATION_TYPE = 'test_notification';
const STORAGE_CHECK_TASK = 'storageCheck';

const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;
const DEBUG_INTERVAL_SECONDS = 10 * 60; // 10 minutes for TestFlight
const STORAGE_WARNING_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const LOW_SPACE_PERCENT_THRESHOLD = 0.10; // 10% of total disk
const LOW_SPACE_MIN_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB absolute threshold
const STORAGE_NOTIFICATION_TITLE = 'Storage almost full';
const STORAGE_NOTIFICATION_BODY = "You're low on free space. Open the app to clean photos.";
const TEST_NOTIFICATION_TITLE = 'Storage check started';
const TEST_NOTIFICATION_BODY = 'Checking your device storage...';
const LAST_STORAGE_WARN_AT_KEY = '@swipeaway_last_storage_warn_at';
const IS_DEBUG = __DEV__; // Use Expo's __DEV__ flag

let storageTaskDefined = false;

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
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      logger.log('[NotificationService] Permission status:', finalStatus);
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
      const freeBytes = await FileSystem.getFreeDiskStorageAsync();
      return freeBytes ?? null;
    } catch (error) {
      logger.error('[NotificationService] Error reading free disk space:', error);
      return null;
    }
  }

  private async getTotalDiskBytes(): Promise<number | null> {
    try {
      const totalBytes = await FileSystem.getTotalDiskCapacityAsync();
      return totalBytes ?? null;
    } catch (error) {
      logger.error('[NotificationService] Error reading total disk capacity:', error);
      return null;
    }
  }

  private async isLowOnSpace(): Promise<boolean> {
    const freeBytes = await this.getFreeDiskBytes();
    if (freeBytes == null || freeBytes <= 0) {
      logger.log('[NotificationService] Free disk bytes unavailable; skipping low-space determination');
      return false;
    }

    const totalBytes = await this.getTotalDiskBytes();
    const meetsPercentThreshold =
      totalBytes != null && totalBytes > 0
        ? freeBytes / totalBytes <= LOW_SPACE_PERCENT_THRESHOLD
        : false;
    const meetsAbsoluteThreshold = freeBytes <= LOW_SPACE_MIN_BYTES;

    logger.log(
      '[NotificationService] Disk space (bytes) free/total:',
      freeBytes,
      totalBytes ?? 'unknown',
      'percent threshold hit?',
      meetsPercentThreshold,
      'absolute threshold hit?',
      meetsAbsoluteThreshold
    );

    return meetsPercentThreshold || meetsAbsoluteThreshold;
  }

  private async canSendStorageWarning(now: number): Promise<boolean> {
    try {
      const lastWarnRaw = await AsyncStorage.getItem(LAST_STORAGE_WARN_AT_KEY);
      if (lastWarnRaw) {
        const lastWarn = Number.parseInt(lastWarnRaw, 10);
        if (!Number.isNaN(lastWarn) && now - lastWarn < STORAGE_WARNING_COOLDOWN_MS) {
          logger.log('[NotificationService] Storage warning skipped due to cooldown window');
          return false;
        }
      }
    } catch (error) {
      logger.error('[NotificationService] Failed to read storage warning timestamp:', error);
    }

    return true;
  }

  private async recordStorageWarning(now: number): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_STORAGE_WARN_AT_KEY, now.toString());
    } catch (error) {
      logger.error('[NotificationService] Failed to persist storage warning timestamp:', error);
    }
  }

  private async sendTestNotification(): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: TEST_NOTIFICATION_TITLE,
        body: TEST_NOTIFICATION_BODY,
        data: {
          type: TEST_NOTIFICATION_TYPE,
          url: 'rork-app://home', // Deep link to open app
        },
      },
      trigger: null,
    });
  }

  private async sendLowStorageNotification(): Promise<void> {
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
  }

  async runStorageCheck(trigger: 'manual' | 'foreground' | 'background' = 'manual'): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        logger.log('[NotificationService] Notifications not granted; skipping storage check');
        return false;
      }

      const isLowOnSpace = await this.isLowOnSpace();
      if (!isLowOnSpace) {
        logger.log('[NotificationService] Disk space OK; no storage alert needed');
        return false;
      }

      const now = Date.now();
      if (!(await this.canSendStorageWarning(now))) {
        return false;
      }

      await this.sendLowStorageNotification();
      await this.recordStorageWarning(now);

      logger.log(`[NotificationService] Low-storage alert scheduled (${trigger})`);
      return true;
    } catch (error) {
      logger.error(`[NotificationService] Error during storage check (${trigger}):`, error);
      return false;
    }
  }

  private ensureStorageTaskDefined(): boolean {
    if (storageTaskDefined) return true;

    try {
      TaskManager.defineTask(STORAGE_CHECK_TASK, async () => {
        try {
          const service = NotificationService.getInstance();

          // Send test notification at start (TestFlight only)
          if (IS_DEBUG) {
            logger.log('[NotificationService] Sending test notification (task started)');
            await service.sendTestNotification();
          }

          // Run storage check and send alert if needed
          const sent = await service.runStorageCheck('background');
          return sent ? BackgroundFetch.Result.NewData : BackgroundFetch.Result.NoData;
        } catch (error) {
          logger.error('[NotificationService] Storage background task error:', error);
          return BackgroundFetch.Result.Failed;
        }
      });

      storageTaskDefined = true;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already defined')) {
        storageTaskDefined = true;
        return true;
      }

      logger.error('[NotificationService] Failed to define storage background task:', error);
      return false;
    }
  }

  async registerStorageCheckTask(): Promise<void> {
    if (Platform.OS === 'web') return;

    if (!this.ensureStorageTaskDefined()) {
      logger.log('[NotificationService] Storage background task not defined; skipping registration');
      return;
    }

    try {
      const status = await BackgroundFetch.getStatusAsync();
      if (status === BackgroundFetch.Status.Restricted || status === BackgroundFetch.Status.Denied) {
        logger.log('[NotificationService] Background fetch unavailable; skipping registration');
        return;
      }

      const isRegistered = await TaskManager.isTaskRegisteredAsync(STORAGE_CHECK_TASK);
      if (isRegistered) {
        logger.log('[NotificationService] Storage background task already registered');
        return;
      }

      const interval = IS_DEBUG ? DEBUG_INTERVAL_SECONDS : ONE_WEEK_IN_SECONDS;

      await BackgroundFetch.registerTaskAsync(STORAGE_CHECK_TASK, {
        minimumInterval: interval,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      logger.log(`[NotificationService] Storage background task registered (interval: ${interval}s, debug: ${IS_DEBUG})`);
    } catch (error) {
      logger.error('[NotificationService] Failed to register storage background task:', error);
    }
  }
}

export default NotificationService;
