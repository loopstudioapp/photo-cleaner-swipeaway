import * as Haptics from 'expo-haptics';
import { logger } from './logger';

export const safeImpact = async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    await Haptics.impactAsync(style);
  } catch (error) {
    logger.error('[Haptics] impact failed:', error);
  }
};
