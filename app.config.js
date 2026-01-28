module.exports = {
  expo: {
    name: "SwipeAway",
    slug: "swipeaway-photo-cleaner",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rork-app",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "app.swipeaway-photo-app",
      buildNumber: "2",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "SwipeAway needs access to your photo library to identify and help you remove duplicate, blurry, and unnecessary photos. Photos are processed on your device and are not uploaded or stored on our servers.",
        NSPhotoLibraryAddUsageDescription: "SwipeAway needs access to your photo library to identify and help you remove duplicate, blurry, and unnecessary photos. Photos are processed on your device and are not uploaded or stored on our servers.",
        ITSAppUsesNonExemptEncryption: false,
        NSUserTrackingUsageDescription: "This helps us measure ad performance and improve your experience.",
        BGTaskSchedulerPermittedIdentifiers: [
          "app.swipeaway.storageCheck",
          "com.expo.modules.backgroundtask.processing"
        ],
        UIBackgroundModes: ["processing"]
      },
      associatedDomains: [
        "applinks:swipeaway.sng.link"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      versionCode: 2,
      package: "app.swipeaway_photo_cleaner",
      permissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO",
        "READ_MEDIA_AUDIO",
        "READ_MEDIA_VISUAL_USER_SELECTED",
        "ACCESS_MEDIA_LOCATION",
        "android.permission.VIBRATE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
        "android.permission.ACCESS_MEDIA_LOCATION",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "swipeaway.sng.link"
            }
          ],
          category: [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://rork.com/"
        }
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-media-library",
        {
          photosPermission: "SwipeAway needs access to your photo library to identify and help you remove duplicate, blurry, and unnecessary photos. Photos are processed on your device and are not uploaded or stored on our servers.",
          savePhotosPermission: "SwipeAway needs access to your photo library to identify and help you remove duplicate, blurry, and unnecessary photos. Photos are processed on your device and are not uploaded or stored on our servers.",
          isAccessMediaLocationEnabled: true
        }
      ],
      [
        "expo-notifications",
        {
          color: "#ffffff",
          defaultChannel: "default",
          enableBackgroundRemoteNotifications: false
        }
      ],
      "expo-background-task",
      "expo-tracking-transparency"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: "https://rork.com/"
      },
      eas: {
        projectId: "16c05d5e-4f3d-441e-85ee-d8422fe9a4f2"
      },
      // RevenueCat API Keys - доступны через Constants.expoConfig.extra
      revenueCat: {
        iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
        testApiKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
      },
      // Singular MMP Keys
      singular: {
        iosApiKey: process.env.EXPO_PUBLIC_SINGULAR_IOS_API_KEY,
        iosSecret: process.env.EXPO_PUBLIC_SINGULAR_IOS_SECRET,
        androidApiKey: process.env.EXPO_PUBLIC_SINGULAR_ANDROID_API_KEY,
        androidSecret: process.env.EXPO_PUBLIC_SINGULAR_ANDROID_SECRET,
      }
    },
    owner: "loop-studio"
  }
};
