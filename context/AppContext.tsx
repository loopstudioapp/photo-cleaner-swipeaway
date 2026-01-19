import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { PhotoAsset, MonthGroup, AppSettings, UserStats, SwipeSession } from '@/models/PhotoAsset';
import PhotoLibraryService from '@/services/PhotoLibraryService';
import NotificationService from '@/services/NotificationService';
import { logger } from '@/utils/logger';

const SETTINGS_KEY = '@swipeaway_settings';
const STATS_KEY = '@swipeaway_stats';
const BOOKMARKS_KEY = '@swipeaway_bookmarks';

const defaultSettings: AppSettings = {
  hasCompletedOnboarding: false,
  hasGrantedPhotoPermission: false,
  sortOrder: 'mostRecent',
  hideCompletedMonths: false,
  hapticFeedback: true,
};

const defaultStats: UserStats = {
  totalPhotosReviewed: 0,
  totalPhotosDeleted: 0,
  totalSpaceSaved: 0,
  sessionsCompleted: 0,
  bookmarkedPhotos: [],
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState<SwipeSession | null>(null);
  const [bookmarkedPhotos, setBookmarkedPhotos] = useState<string[]>([]);

  const photoService = useMemo(() => PhotoLibraryService.getInstance(), []);
  const notificationService = useMemo(() => NotificationService.getInstance(), []);

  useEffect(() => {
    loadPersistedData();
  }, []);

  // Background task registration is now handled in notifications.tsx after permission is granted
  // No manual or foreground checks needed - only background task runs

  const loadPersistedData = async () => {
    try {
      const [settingsData, statsData, bookmarksData] = await Promise.all([
        AsyncStorage.getItem(SETTINGS_KEY),
        AsyncStorage.getItem(STATS_KEY),
        AsyncStorage.getItem(BOOKMARKS_KEY),
      ]);

      if (settingsData) {
        setSettings(JSON.parse(settingsData));
      }
      if (statsData) {
        setStats(JSON.parse(statsData));
      }
      if (bookmarksData) {
        setBookmarkedPhotos(JSON.parse(bookmarksData));
      }

      logger.log('[AppContext] Loaded persisted data');
    } catch (error) {
      logger.error('[AppContext] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    logger.log('[AppContext] Settings updated:', newSettings);
  }, [settings]);

  const updateStats = useCallback(async (newStats: Partial<UserStats>) => {
    const updated = { ...stats, ...newStats };
    setStats(updated);
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated));
    logger.log('[AppContext] Stats updated:', newStats);
  }, [stats]);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const groups = await photoService.getAllPhotosGroupedByMonth();
      setMonthGroups(groups);
      logger.log('[AppContext] Loaded month groups:', groups.length);
    } catch (error) {
      logger.error('[AppContext] Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [photoService]);

  const requestPhotoPermission = useCallback(async (): Promise<boolean> => {
    const granted = await photoService.requestPermission();
    await updateSettings({ hasGrantedPhotoPermission: granted });
    if (granted) {
      await loadPhotos();
    }
    return granted;
  }, [photoService, updateSettings, loadPhotos]);

  const completeOnboarding = useCallback(async () => {
    await updateSettings({ hasCompletedOnboarding: true });
  }, [updateSettings]);

  const startSwipeSession = useCallback((photos: PhotoAsset[]) => {
    const session: SwipeSession = {
      id: Date.now().toString(),
      startTime: Date.now(),
      photosReviewed: 0,
      photosKept: 0,
      photosDeleted: 0,
      spaceSaved: 0,
    };
    setCurrentSession(session);
    logger.log('[AppContext] Started swipe session:', session.id);
    return session;
  }, []);

  const updateSwipeSession = useCallback((updates: Partial<SwipeSession>) => {
    setCurrentSession(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const endSwipeSession = useCallback(async () => {
    if (currentSession) {
      const finalSession = { ...currentSession, endTime: Date.now() };
      await updateStats({
        totalPhotosReviewed: stats.totalPhotosReviewed + finalSession.photosReviewed,
        totalPhotosDeleted: stats.totalPhotosDeleted + finalSession.photosDeleted,
        totalSpaceSaved: stats.totalSpaceSaved + finalSession.spaceSaved,
        sessionsCompleted: stats.sessionsCompleted + 1,
      });
      setCurrentSession(null);
      logger.log('[AppContext] Ended swipe session:', finalSession);
    }
  }, [currentSession, stats, updateStats]);

  const toggleBookmark = useCallback(async (photoId: string) => {
    const newBookmarks = bookmarkedPhotos.includes(photoId)
      ? bookmarkedPhotos.filter(id => id !== photoId)
      : [...bookmarkedPhotos, photoId];
    
    setBookmarkedPhotos(newBookmarks);
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
    logger.log('[AppContext] Toggled bookmark:', photoId);
  }, [bookmarkedPhotos]);

  const isBookmarked = useCallback((photoId: string) => {
    return bookmarkedPhotos.includes(photoId);
  }, [bookmarkedPhotos]);

  const setSortOrder = useCallback(async (order: 'mostRecent' | 'leastRecent' | 'mostPhotos' | 'fewestPhotos') => {
    await updateSettings({ sortOrder: order });
  }, [updateSettings]);

  const setHideCompletedMonths = useCallback(async (hide: boolean) => {
    await updateSettings({ hideCompletedMonths: hide });
  }, [updateSettings]);

  const getOnThisDayPhotos = useCallback(async (): Promise<PhotoAsset[]> => {
    try {
      const photos = await photoService.getOnThisDayAssets(new Date());
      return photos;
    } catch (error) {
      logger.error('[AppContext] Error getting on this day photos:', error);
      return [];
    }
  }, [photoService]);

  const removePhotosFromState = useCallback((assetIds: string[]) => {
    if (assetIds.length === 0) return;

    const idsSet = new Set(assetIds);
    setMonthGroups(prevGroups => {
      return prevGroups
        .map(group => {
          const filteredPhotos = group.photos.filter(photo => !idsSet.has(photo.id));
          return {
            ...group,
            photos: filteredPhotos,
            photoCount: filteredPhotos.length,
          };
        })
        .filter(group => group.photoCount > 0);
    });
  }, []);

  const deletePhoto = useCallback(async (assetId: string): Promise<boolean> => {
    try {
      const result = await photoService.deleteAsset(assetId);
      // Remove photo from monthGroups state regardless of deletion result
      removePhotosFromState([assetId]);
      logger.log('[AppContext] Removed photo from state:', assetId);
      return result.success;
    } catch (error) {
      logger.error('[AppContext] Error deleting photo:', error);
      // Still remove from local state even if real deletion fails
      removePhotosFromState([assetId]);
      return false;
    }
  }, [photoService, removePhotosFromState]);

  const batchDeletePhotos = useCallback(async (assetIds: string[]): Promise<boolean> => {
    if (assetIds.length === 0) return true;
    
    try {
      logger.log('[AppContext] Batch deleting photos:', assetIds.length);
      const result = await photoService.deletePhotos(assetIds);
      
      // Remove photos from monthGroups state
      removePhotosFromState(assetIds);
      logger.log('[AppContext] Batch delete result:', result);
      return result;
    } catch (error) {
      logger.error('[AppContext] Error batch deleting photos:', error);
      // Still remove from local state even if real deletion fails
      removePhotosFromState(assetIds);
      return false;
    }
  }, [photoService, removePhotosFromState]);

  const totalPhotoCount = useMemo(() => {
    return monthGroups.reduce((sum, group) => sum + group.photoCount, 0);
  }, [monthGroups]);

  return {
    settings,
    stats,
    monthGroups,
    isLoading,
    currentSession,
    bookmarkedPhotos,
    totalPhotoCount,
    updateSettings,
    updateStats,
    loadPhotos,
    requestPhotoPermission,
    completeOnboarding,
    startSwipeSession,
    updateSwipeSession,
    endSwipeSession,
    toggleBookmark,
    isBookmarked,
    setSortOrder,
    setHideCompletedMonths,
    getOnThisDayPhotos,
    deletePhoto,
    batchDeletePhotos,
  };
});
