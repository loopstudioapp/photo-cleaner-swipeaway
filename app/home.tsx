import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Shuffle, Calendar } from 'lucide-react-native';
import { colors, gradients, spacing } from '@/theme/Theme';
import { useApp } from '@/context/AppContext';
import HeaderLogoBar from '@/components/HeaderLogoBar';
import GradientRow from '@/components/GradientRow';
import MonthRow from '@/components/MonthRow';
import SortOverlay from '@/components/SortOverlay';

export default function HomeScreen() {
  const router = useRouter();
  const { monthGroups, settings, loadPhotos, setSortOrder, setHideCompletedMonths } = useApp();
  const [showSortOverlay, setShowSortOverlay] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (settings.hasGrantedPhotoPermission || Platform.OS === 'web') {
      loadPhotos();
    }
  }, [settings.hasGrantedPhotoPermission, loadPhotos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  }, [loadPhotos]);

  const handleSortPress = () => {
    setShowSortOverlay(true);
  };

  const handleMenuPress = () => {
    router.push('/menu');
  };

  const handleRecentsPress = () => {
    router.push('/swipe?mode=recents');
  };

  const handleRandomPress = () => {
    router.push('/swipe?mode=random');
  };

  const handleOnThisDayPress = () => {
    router.push('/swipe?mode=onThisDay');
  };

  const handleMonthPress = (monthId: string) => {
    router.push(`/swipe?mode=month&monthId=${monthId}`);
  };

  const handleSortSelect = (sort: 'mostRecent' | 'leastRecent' | 'mostPhotos' | 'fewestPhotos') => {
    setSortOrder(sort);
  };

  const handleHideCompletedSelect = (hide: boolean) => {
    setHideCompletedMonths(hide);
  };

  const sortedMonthGroups = useMemo(() => {
    const groups = [...monthGroups];
    
    switch (settings.sortOrder) {
      case 'mostRecent':
        groups.sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });
        break;
      case 'leastRecent':
        groups.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
        break;
      case 'mostPhotos':
        groups.sort((a, b) => b.photoCount - a.photoCount);
        break;
      case 'fewestPhotos':
        groups.sort((a, b) => a.photoCount - b.photoCount);
        break;
    }
    
    return groups;
  }, [monthGroups, settings.sortOrder]);

  const recentCount = monthGroups.length > 0 ? monthGroups[0].photoCount : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <HeaderLogoBar
          onSortPress={handleSortPress}
          onMenuPress={handleMenuPress}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.textPrimary}
            />
          }
        >
          <GradientRow
            title="Recents"
            subtitle={`${recentCount} photos`}
            gradientColors={gradients.recents}
            onPress={handleRecentsPress}
            leftIcon={<Clock size={28} color={colors.white} strokeWidth={2.5} />}
            badge={recentCount > 0 ? recentCount : undefined}
            height={90}
          />

          <GradientRow
            title="Random"
            subtitle="Shuffle through all photos"
            gradientColors={gradients.random}
            onPress={handleRandomPress}
            leftIcon={<Shuffle size={28} color={colors.white} strokeWidth={2.5} />}
            height={90}
          />

          <GradientRow
            title="On this day"
            subtitle="Photos from today in past years"
            gradientColors={gradients.onThisDay}
            onPress={handleOnThisDayPress}
            leftIcon={<Calendar size={28} color={colors.white} strokeWidth={2.5} />}
            height={90}
          />

          <View style={styles.monthsContainer}>
            {sortedMonthGroups.map((group) => (
              <MonthRow
                key={group.id}
                label={group.label}
                photoCount={group.photoCount}
                onPress={() => handleMonthPress(group.id)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <SortOverlay
        visible={showSortOverlay}
        currentSort={settings.sortOrder}
        hideCompleted={settings.hideCompletedMonths}
        onSortSelect={handleSortSelect}
        onHideCompletedSelect={handleHideCompletedSelect}
        onClose={() => setShowSortOverlay(false)}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  monthsContainer: {
    marginTop: spacing.md,
  },
});
