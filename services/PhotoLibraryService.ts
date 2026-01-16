import * as MediaLibrary from 'expo-media-library';
import { PhotoAsset, MonthGroup } from '@/models/PhotoAsset';
import { logger } from '@/utils/logger';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

class PhotoLibraryService {
  private static instance: PhotoLibraryService;

  static getInstance(): PhotoLibraryService {
    if (!PhotoLibraryService.instance) {
      PhotoLibraryService.instance = new PhotoLibraryService();
    }
    return PhotoLibraryService.instance;
  }

  async requestPermission(): Promise<boolean> {
    // Request read permission with full access (not writeOnly)
    const { status, accessPrivileges } = await MediaLibrary.requestPermissionsAsync(false);
    logger.log('[PhotoLibraryService] Permission status:', status, 'accessPrivileges:', accessPrivileges);
    // Return true only if we have full access to all photos
    return status === 'granted' && accessPrivileges === 'all';
  }

  async checkPermission(): Promise<boolean> {
    const { status, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
    logger.log('[PhotoLibraryService] Check permission - status:', status, 'accessPrivileges:', accessPrivileges);
    return status === 'granted' && accessPrivileges === 'all';
  }

  async hasFullAccess(): Promise<boolean> {
    const { status, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
    return status === 'granted' && accessPrivileges === 'all';
  }

  async getPhotos(limit: number = 100, after?: string): Promise<{ photos: PhotoAsset[]; endCursor?: string; hasNextPage: boolean }> {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        first: limit,
        after,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const photos: PhotoAsset[] = result.assets.map(asset => this.mapAssetToPhoto(asset));

      logger.log('[PhotoLibraryService] Fetched photos:', photos.length);

      return {
        photos,
        endCursor: result.endCursor,
        hasNextPage: result.hasNextPage,
      };
    } catch (error) {
      logger.error('[PhotoLibraryService] Error fetching photos:', error);
      return { photos: [], hasNextPage: false };
    }
  }

  async getAllPhotosGroupedByMonth(): Promise<MonthGroup[]> {
    const allPhotos: PhotoAsset[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await this.getPhotos(500, cursor);
      allPhotos.push(...result.photos);
      cursor = result.endCursor;
      hasMore = result.hasNextPage;
      
      if (allPhotos.length > 2000) break;
    }

    return this.groupPhotosByMonth(allPhotos);
  }

  private groupPhotosByMonth(photos: PhotoAsset[]): MonthGroup[] {
    const groups: Map<string, MonthGroup> = new Map();

    photos.forEach(photo => {
      const date = new Date(photo.creationTime);
      const month = date.getMonth();
      const year = date.getFullYear();
      const key = `${year}-${month}`;
      const label = `${MONTH_NAMES[month]} ${year}`;

      if (!groups.has(key)) {
        groups.set(key, {
          id: key,
          label,
          month,
          year,
          photoCount: 0,
          photos: [],
        });
      }

      const group = groups.get(key)!;
      group.photoCount++;
      group.photos.push(photo);
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  private mapAssetToPhoto(asset: MediaLibrary.Asset): PhotoAsset {
    const date = new Date(asset.creationTime);
    const month = date.getMonth();
    const year = date.getFullYear();

    return {
      id: asset.id,
      uri: asset.uri,
      filename: asset.filename,
      mediaType: asset.mediaType === 'photo' ? 'photo' : 'video',
      width: asset.width,
      height: asset.height,
      creationTime: asset.creationTime,
      modificationTime: asset.modificationTime,
      duration: asset.duration,
      month: `${MONTH_NAMES[month]} ${year}`,
      year,
    };
  }

  async deletePhotos(photoIds: string[]): Promise<boolean> {
    try {
      const result = await MediaLibrary.deleteAssetsAsync(photoIds);
      logger.log('[PhotoLibraryService] Deleted photos:', result);
      return result;
    } catch (error) {
      logger.error('[PhotoLibraryService] Error deleting photos:', error);
      return false;
    }
  }

  async getPhotoInfo(photoId: string): Promise<MediaLibrary.AssetInfo | null> {
    try {
      const info = await MediaLibrary.getAssetInfoAsync(photoId);
      return info;
    } catch (error) {
      logger.error('[PhotoLibraryService] Error getting photo info:', error);
      return null;
    }
  }

  async getOnThisDayAssets(date: Date = new Date()): Promise<PhotoAsset[]> {
    const allPhotos: PhotoAsset[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    const targetMonth = date.getMonth();
    const targetDay = date.getDate();

    while (hasMore) {
      const result = await this.getPhotos(500, cursor);
      allPhotos.push(...result.photos);
      cursor = result.endCursor;
      hasMore = result.hasNextPage;
      
      if (allPhotos.length > 2000) break;
    }

    const onThisDayPhotos = allPhotos.filter(photo => {
      const photoDate = new Date(photo.creationTime);
      return photoDate.getMonth() === targetMonth && photoDate.getDate() === targetDay;
    });

    logger.log('[PhotoLibraryService] On This Day photos found:', onThisDayPhotos.length);
    return onThisDayPhotos;
  }

  async deleteAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await MediaLibrary.deleteAssetsAsync([assetId]);
      logger.log('[PhotoLibraryService] Delete result for', assetId, ':', result);
      return { success: result };
    } catch (error) {
      logger.error('[PhotoLibraryService] Error deleting asset:', error);
      return { success: false, error: String(error) };
    }
  }
}

export default PhotoLibraryService;
