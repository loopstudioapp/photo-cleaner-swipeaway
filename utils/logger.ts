/**
 * Development-only logger utility
 * Prevents console spam in production while preserving errors
 */

export const logger = {
  /**
   * Log debug information (dev only)
   */
  log: (...args: any[]) => {
    if (__DEV__) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log warnings (dev only)
   */
  warn: (...args: any[]) => {
    if (__DEV__) {
      console.warn(...args);
    }
  },

  /**
   * Log info (dev only)
   */
  info: (...args: any[]) => {
    if (__DEV__) {
      console.info(...args);
    }
  },
};
