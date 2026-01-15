import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
      console.log('[NotificationService] Web platform - skipping permission request');
      return true;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      console.log('[NotificationService] Permission status:', finalStatus);
      return finalStatus === 'granted';
    } catch (error) {
      console.error('[NotificationService] Error requesting permission:', error);
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
      console.error('[NotificationService] Error getting status:', error);
      return 'undetermined';
    }
  }

  async scheduleCleanupReminder(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to clean up!',
          body: 'Your camera roll is waiting. Swipe through some photos today!',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 60 * 60 * 24 * 3,
          repeats: true,
        },
      });
      console.log('[NotificationService] Cleanup reminder scheduled');
    } catch (error) {
      console.error('[NotificationService] Error scheduling notification:', error);
    }
  }
}

export default NotificationService;
