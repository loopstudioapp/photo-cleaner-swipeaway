export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  mediaType: 'photo' | 'video';
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
  fileSize?: number;
  duration?: number;
  month: string;
  year: number;
}

export interface MonthGroup {
  id: string;
  label: string;
  month: number;
  year: number;
  photoCount: number;
  photos: PhotoAsset[];
}

export type SwipeDecision = 'keep' | 'delete' | 'bookmark';

export interface SwipeSession {
  id: string;
  startTime: number;
  endTime?: number;
  photosReviewed: number;
  photosKept: number;
  photosDeleted: number;
  spaceSaved: number;
}

export interface SubscriptionState {
  isSubscribed: boolean;
  plan: 'free' | 'weekly' | 'yearly';
  expiresAt?: number;
  trialEndsAt?: number;
}

export interface AppSettings {
  hasCompletedOnboarding: boolean;
  hasGrantedPhotoPermission: boolean;
  sortOrder: 'mostRecent' | 'leastRecent' | 'mostPhotos' | 'fewestPhotos';
  hideCompletedMonths: boolean;
  hapticFeedback: boolean;
}

export interface UserStats {
  totalPhotosReviewed: number;
  totalPhotosDeleted: number;
  totalSpaceSaved: number;
  sessionsCompleted: number;
  bookmarkedPhotos: string[];
}
