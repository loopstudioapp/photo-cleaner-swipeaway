import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Info, RotateCcw, Check, Bookmark, Trash2, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { colors, typography, spacing, iconSizes } from '@/theme/Theme';
import { useApp } from '@/context/AppContext';
import { usePurchases } from '@/context/PurchasesContext';
import { PhotoAsset } from '@/models/PhotoAsset';
import SwipeCard from '@/components/SwipeCard';

interface SwipeHistoryItem {
  photo: PhotoAsset;
  action: 'keep' | 'delete';
  index: number;
}

const PLACEHOLDER_PHOTOS = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800',
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
];

export default function SwipeScreen() {
  const router = useRouter();
  const { mode, monthId } = useLocalSearchParams<{ mode: string; monthId?: string }>();
  const { 
    monthGroups, 
    toggleBookmark, 
    isBookmarked, 
    updateSwipeSession, 
    currentSession, 
    startSwipeSession,
    getOnThisDayPhotos,
    batchDeletePhotos,
    endSwipeSession
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([]);
  const [keptPhotos, setKeptPhotos] = useState<string[]>([]);
  const [history, setHistory] = useState<SwipeHistoryItem[]>([]);
  const [onThisDayPhotos, setOnThisDayPhotos] = useState<PhotoAsset[]>([]);
  const [isLoadingOnThisDay, setIsLoadingOnThisDay] = useState(false);
  const [currentPhotoSize, setCurrentPhotoSize] = useState<number | null>(null);
  const [isLoadingSize, setIsLoadingSize] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<PhotoAsset[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const sessionEndedRef = useRef(false);
  const [swipeCount, setSwipeCount] = useState(0);
  
  const { isPremium } = usePurchases();

  useEffect(() => {
    if (mode === 'onThisDay') {
      setIsLoadingOnThisDay(true);
      getOnThisDayPhotos().then(photos => {
        setOnThisDayPhotos(photos);
        setIsLoadingOnThisDay(false);
        console.log('[SwipeScreen] Loaded on this day photos:', photos.length);
      });
    }
  }, [mode, getOnThisDayPhotos]);

  const photos = useMemo(() => {
    let result: PhotoAsset[] = [];

    if (Platform.OS === 'web' || monthGroups.length === 0) {
      return PLACEHOLDER_PHOTOS.map((uri, idx) => ({
        id: `placeholder-${idx}`,
        uri,
        filename: `photo-${idx}.jpg`,
        mediaType: 'photo' as const,
        width: 1920,
        height: 1280,
        creationTime: Date.now() - idx * 86400000,
        modificationTime: Date.now(),
        fileSize: 2000000,
        month: 'Jan 2024',
        year: 2024,
      }));
    }

    if (mode === 'recents' && monthGroups.length > 0) {
      result = monthGroups[0].photos;
    } else if (mode === 'month' && monthId) {
      const group = monthGroups.find(g => g.id === monthId);
      result = group?.photos || [];
    } else if (mode === 'random') {
      const allPhotos = monthGroups.flatMap(g => g.photos);
      result = [...allPhotos].sort(() => Math.random() - 0.5);
    } else if (mode === 'onThisDay') {
      result = onThisDayPhotos;
    } else {
      result = monthGroups.flatMap(g => g.photos);
    }

    return result;
  }, [mode, monthId, monthGroups, onThisDayPhotos]);

  useEffect(() => {
    if (!currentSession && photos.length > 0) {
      startSwipeSession(photos);
    }
  }, [photos, currentSession, startSwipeSession]);

  const currentPhoto = photos[currentIndex];
  const progress = photos.length > 0 ? `${currentIndex + 1}/${photos.length}` : '0/0';
  const isComplete = currentIndex >= photos.length;

  const handleFinishSession = useCallback(async () => {
    if (sessionEndedRef.current || isDeleting) return;
    
    setIsDeleting(true);
    sessionEndedRef.current = true;
    
    if (pendingDeletions.length > 0 && Platform.OS !== 'web') {
      const idsToDelete = pendingDeletions
        .filter(p => !p.id.startsWith('placeholder'))
        .map(p => p.id);
      
      if (idsToDelete.length > 0) {
        console.log('[SwipeScreen] Batch deleting', idsToDelete.length, 'photos');
        await batchDeletePhotos(idsToDelete);
      }
    }
    
    if (currentSession) {
      endSwipeSession();
    }
    
    setIsDeleting(false);
    router.back();
  }, [pendingDeletions, batchDeletePhotos, currentSession, endSwipeSession, router, isDeleting]);

  const handleBack = useCallback(() => {
    handleFinishSession();
  }, [handleFinishSession]);

  const handleSwipeRight = useCallback(() => {
    if (currentPhoto) {
      setKeptPhotos(prev => [...prev, currentPhoto.id]);
      setHistory(prev => [...prev, { photo: currentPhoto, action: 'keep', index: currentIndex }]);
      updateSwipeSession({
        photosReviewed: (currentSession?.photosReviewed || 0) + 1,
        photosKept: (currentSession?.photosKept || 0) + 1,
      });
      console.log('[SwipeScreen] Kept photo:', currentPhoto.id);
    }
  }, [currentPhoto, currentIndex, currentSession, updateSwipeSession]);

  const handleSwipeLeft = useCallback(() => {
    if (currentPhoto) {
      const photoSize = currentPhoto.fileSize || 2000000;
      
      // Add to pending deletions instead of deleting immediately
      setPendingDeletions(prev => [...prev, currentPhoto]);
      
      setDeletedPhotos(prev => [...prev, currentPhoto.id]);
      setHistory(prev => [...prev, { photo: currentPhoto, action: 'delete', index: currentIndex }]);
      updateSwipeSession({
        photosReviewed: (currentSession?.photosReviewed || 0) + 1,
        photosDeleted: (currentSession?.photosDeleted || 0) + 1,
        spaceSaved: (currentSession?.spaceSaved || 0) + photoSize,
      });
      console.log('[SwipeScreen] Marked for deletion:', currentPhoto.id, 'Size:', photoSize);
    }
  }, [currentPhoto, currentIndex, currentSession, updateSwipeSession]);

  const handleSwipeComplete = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
    
    // Show paywall every 3 swipes for non-premium users
    const newSwipeCount = swipeCount + 1;
    setSwipeCount(newSwipeCount);
    
    if (!isPremium && newSwipeCount % 3 === 0) {
      console.log('[SwipeScreen] Showing paywall after', newSwipeCount, 'swipes');
      router.push('/paywall?source=swipe');
    }
  }, [swipeCount, isPremium, router]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    
    setHistory(prev => prev.slice(0, -1));
    
    if (lastAction.action === 'keep') {
      setKeptPhotos(prev => prev.filter(id => id !== lastAction.photo.id));
      updateSwipeSession({
        photosReviewed: Math.max(0, (currentSession?.photosReviewed || 0) - 1),
        photosKept: Math.max(0, (currentSession?.photosKept || 0) - 1),
      });
    } else {
      setDeletedPhotos(prev => prev.filter(id => id !== lastAction.photo.id));
      setPendingDeletions(prev => prev.filter(p => p.id !== lastAction.photo.id));
      updateSwipeSession({
        photosReviewed: Math.max(0, (currentSession?.photosReviewed || 0) - 1),
        photosDeleted: Math.max(0, (currentSession?.photosDeleted || 0) - 1),
        spaceSaved: Math.max(0, (currentSession?.spaceSaved || 0) - (lastAction.photo.fileSize || 2000000)),
      });
    }

    setCurrentIndex(prev => Math.max(0, prev - 1));
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[SwipeScreen] Undid last action:', lastAction.action, 'for photo:', lastAction.photo.id);
  }, [history, currentSession, updateSwipeSession]);

  const handleBookmark = useCallback(() => {
    if (currentPhoto) {
      toggleBookmark(currentPhoto.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [currentPhoto, toggleBookmark]);

  const handleDone = useCallback(() => {
    handleFinishSession();
  }, [handleFinishSession]);

  const handleDeleteButton = useCallback(() => {
    handleSwipeLeft();
    handleSwipeComplete();
  }, [handleSwipeLeft, handleSwipeComplete]);

  const handleKeepButton = useCallback(() => {
    handleSwipeRight();
    handleSwipeComplete();
  }, [handleSwipeRight, handleSwipeComplete]);

  const fetchPhotoSize = useCallback(async () => {
    if (!currentPhoto || Platform.OS === 'web' || currentPhoto.id.startsWith('placeholder')) {
      setCurrentPhotoSize(currentPhoto?.fileSize || null);
      return;
    }
    
    setIsLoadingSize(true);
    try {
      const info = await MediaLibrary.getAssetInfoAsync(currentPhoto.id);
      console.log('[SwipeScreen] Full asset info:', JSON.stringify(info, null, 2));
      
      // Try multiple ways to get file size
      let size: number | null = null;
      
      // Check direct fileSize property
      if ('fileSize' in info && typeof info.fileSize === 'number') {
        size = info.fileSize;
      }
      // Check if it's nested in exif or other properties
      else if ((info as any).exif?.FileSize) {
        size = (info as any).exif.FileSize;
      }
      // Fallback: estimate from dimensions (rough estimate)
      else if (currentPhoto.width && currentPhoto.height) {
        // Rough estimate: width * height * 3 bytes (RGB) / compression ratio (~10)
        size = Math.round((currentPhoto.width * currentPhoto.height * 3) / 10);
        console.log('[SwipeScreen] Using estimated size based on dimensions');
      }
      
      setCurrentPhotoSize(size);
      console.log('[SwipeScreen] Fetched file size:', size);
    } catch (error) {
      console.error('[SwipeScreen] Error fetching file size:', error);
      setCurrentPhotoSize(null);
    } finally {
      setIsLoadingSize(false);
    }
  }, [currentPhoto]);

  useEffect(() => {
    if (showInfo && currentPhoto) {
      fetchPhotoSize();
    }
  }, [showInfo, currentPhoto, fetchPhotoSize]);

  const formatFileSize = (bytes?: number | null): string => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoadingOnThisDay && mode === 'onThisDay') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completeContainer}>
            <Text style={styles.completeTitle}>Loading...</Text>
            <Text style={styles.completeStats}>Finding photos from this day</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (isComplete || photos.length === 0) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completeContainer}>
            <Text style={styles.completeTitle}>
              {photos.length === 0 ? 'No Photos' : 'All Done!'}
            </Text>
            <Text style={styles.completeStats}>
              {photos.length === 0 
                ? 'No photos found for this selection'
                : `${keptPhotos.length} kept • ${deletedPhotos.length} deleted`
              }
            </Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleFinishSession}>
              <Text style={styles.doneButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
            <ArrowLeft size={iconSizes.md} color={colors.white} strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowInfo(true)} style={styles.iconButton}>
            <Info size={iconSizes.md} color={colors.white} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.progress}>{progress}</Text>

          <TouchableOpacity onPress={handleBookmark} style={styles.iconButton}>
            <Bookmark
              size={iconSizes.md}
              color={currentPhoto && isBookmarked(currentPhoto.id) ? colors.deletePurple : colors.white}
              strokeWidth={2.5}
              fill={currentPhoto && isBookmarked(currentPhoto.id) ? colors.deletePurple : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUndo}
            style={[styles.iconButton, history.length === 0 && styles.iconButtonDisabled]}
            disabled={history.length === 0}
          >
            <RotateCcw size={iconSizes.md} color={history.length > 0 ? colors.white : 'rgba(255,255,255,0.3)'} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          {currentPhoto && (
            <SwipeCard
              uri={currentPhoto.uri}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeComplete={handleSwipeComplete}
              aspectRatio={currentPhoto.width / currentPhoto.height}
            />
          )}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteButton}>
            <Trash2 size={32} color={colors.deletePurple} strokeWidth={2.5} />
            <Text style={styles.deleteText}>DELETE</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDone} style={styles.doneSessionButton}>
            <Check size={20} color={colors.white} strokeWidth={3} />
            <Text style={styles.doneSessionText}>DONE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.keepButton} onPress={handleKeepButton}>
            <Heart size={32} color={colors.keepGreen} strokeWidth={2.5} fill={colors.keepGreen} />
            <Text style={styles.keepText}>KEEP</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={showInfo} transparent animationType="fade" onRequestClose={() => setShowInfo(false)}>
        <Pressable style={styles.infoOverlay} onPress={() => setShowInfo(false)}>
          <Pressable style={styles.infoContent} onPress={(e) => e.stopPropagation()}>
            {currentPhoto && (
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabelItalic}>this image is</Text>
                <Text style={styles.infoValueLarge}>
                  {isLoadingSize ? 'Loading...' : formatFileSize(currentPhotoSize || currentPhoto.fileSize)}
                </Text>
                
                <Text style={styles.infoLabelItalic}>and was created on</Text>
                <Text style={styles.infoValueLarge}>{formatDate(currentPhoto.creationTime)}</Text>
                
                <Text style={styles.infoLabelItalic}>at</Text>
                <Text style={styles.infoValueLarge}>{formatTime(currentPhoto.creationTime)}</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    padding: spacing.sm,
  },
  iconButtonDisabled: {
    opacity: 0.3,
  },
  progress: {
    fontSize: typography.body.fontSize,
    fontWeight: '700' as const,
    color: colors.white,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  deleteButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.deletePurple,
    marginTop: spacing.xs,
  },

  doneSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.keepGreen,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    gap: 6,
  },
  doneSessionText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.white,
  },
  keepButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  keepText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.keepGreen,
    marginTop: spacing.xs,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  completeTitle: {
    fontSize: typography.titleHeavy.fontSize,
    fontWeight: typography.titleHeavy.fontWeight,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  completeStats: {
    fontSize: typography.body.fontSize,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xxl,
  },
  doneButton: {
    backgroundColor: colors.keepGreen,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
  },
  doneButtonText: {
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    color: colors.textPrimary,
  },
  infoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  infoContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  infoTextContainer: {
    alignItems: 'flex-start',
  },
  infoLabelItalic: {
    fontSize: typography.body.fontSize,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.lg,
  },
  infoValueLarge: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.white,
    marginTop: spacing.xs,
  },
});
