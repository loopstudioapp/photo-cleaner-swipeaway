import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PhotoAsset, MonthGroup, AppSettings, UserStats, SwipeSession } from '@/models/PhotoAsset';
import PhotoLibraryService from '@/services/PhotoLibraryService';

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

  useEffect(() => {
    loadPersistedData();
  }, []);

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

      console.log('[AppContext] Loaded persisted data');
    } catch (error) {
      console.error('[AppContext] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    console.log('[AppContext] Settings updated:', newSettings);
  }, [settings]);

  const updateStats = useCallback(async (newStats: Partial<UserStats>) => {
    const updated = { ...stats, ...newStats };
    setStats(updated);
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updated));
    console.log('[AppContext] Stats updated:', newStats);
  }, [stats]);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const groups = await photoService.getAllPhotosGroupedByMonth();
      setMonthGroups(groups);
      console.log('[AppContext] Loaded month groups:', groups.length);
    } catch (error) {
      console.error('[AppContext] Error loading photos:', error);
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
    console.log('[AppContext] Started swipe session:', session.id);
    return session;
  }, []);

  const updateSwipeSession = useCallback((updates: Partial<SwipeSession>) => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, ...updates });
    }
  }, [currentSession]);

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
      console.log('[AppContext] Ended swipe session:', finalSession);
    }
  }, [currentSession, stats, updateStats]);

  const toggleBookmark = useCallback(async (photoId: string) => {
    const newBookmarks = bookmarkedPhotos.includes(photoId)
      ? bookmarkedPhotos.filter(id => id !== photoId)
      : [...bookmarkedPhotos, photoId];
    
    setBookmarkedPhotos(newBookmarks);
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
    console.log('[AppContext] Toggled bookmark:', photoId);
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
      console.error('[AppContext] Error getting on this day photos:', error);
      return [];
    }
  }, [photoService]);

  const deletePhoto = useCallback(async (assetId: string): Promise<boolean> => {
    try {
      const result = await photoService.deleteAsset(assetId);
      
      // Remove photo from monthGroups state regardless of deletion result
      // This ensures deleted photos don't show up again
      setMonthGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          photos: group.photos.filter(photo => photo.id !== assetId),
          photoCount: group.photos.filter(photo => photo.id !== assetId).length,
        })).filter(group => group.photoCount > 0);
      });
      
      console.log('[AppContext] Removed photo from state:', assetId);
      return result.success;
    } catch (error) {
      console.error('[AppContext] Error deleting photo:', error);
      // Still remove from local state even if real deletion fails
      setMonthGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          photos: group.photos.filter(photo => photo.id !== assetId),
          photoCount: group.photos.filter(photo => photo.id !== assetId).length,
        })).filter(group => group.photoCount > 0);
      });
      return false;
    }
  }, [photoService]);

  const batchDeletePhotos = useCallback(async (assetIds: string[]): Promise<boolean> => {
    if (assetIds.length === 0) return true;
    
    try {
      console.log('[AppContext] Batch deleting photos:', assetIds.length);
      const result = await photoService.deletePhotos(assetIds);
      
      // Remove photos from monthGroups state
      const idsSet = new Set(assetIds);
      setMonthGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          photos: group.photos.filter(photo => !idsSet.has(photo.id)),
          photoCount: group.photos.filter(photo => !idsSet.has(photo.id)).length,
        })).filter(group => group.photoCount > 0);
      });
      
      console.log('[AppContext] Batch delete result:', result);
      return result;
    } catch (error) {
      console.error('[AppContext] Error batch deleting photos:', error);
      // Still remove from local state even if real deletion fails
      const idsSet = new Set(assetIds);
      setMonthGroups(prevGroups => {
        return prevGroups.map(group => ({
          ...group,
          photos: group.photos.filter(photo => !idsSet.has(photo.id)),
          photoCount: group.photos.filter(photo => !idsSet.has(photo.id)).length,
        })).filter(group => group.photoCount > 0);
      });
      return false;
    }
  }, [photoService]);

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
