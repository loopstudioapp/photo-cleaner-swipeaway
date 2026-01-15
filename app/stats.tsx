import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Eye, HardDrive, Zap } from 'lucide-react-native';
import { colors, typography, spacing, radii, iconSizes } from '@/theme/Theme';
import { useApp } from '@/context/AppContext';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function StatsScreen() {
  const router = useRouter();
  const { stats } = useApp();

  const handleBack = () => {
    router.back();
  };

  const statCards = [
    {
      icon: Eye,
      label: 'Reviewed',
      value: stats.totalPhotosReviewed.toString(),
      color: '#1E5BFF',
    },
    {
      icon: Trash2,
      label: 'Deleted',
      value: stats.totalPhotosDeleted.toString(),
      color: '#B47BFF',
    },
    {
      icon: HardDrive,
      label: 'Space Saved',
      value: formatBytes(stats.totalSpaceSaved),
      color: '#00C89B',
    },
    {
      icon: Zap,
      label: 'Sessions',
      value: stats.sessionsCompleted.toString(),
      color: '#FF6B5E',
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={iconSizes.md} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Stats</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.cardsContainer}>
          <View style={styles.row}>
            {statCards.slice(0, 2).map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: stat.color }]}>
                  <stat.icon size={24} color={colors.white} strokeWidth={2.5} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.row}>
            {statCards.slice(2, 4).map((stat, index) => (
              <View key={index + 2} style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: stat.color }]}>
                  <stat.icon size={24} color={colors.white} strokeWidth={2.5} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            Keep swiping to free up more space! 🎉
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pinkBase,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  cardsContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  motivationContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  motivationText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
