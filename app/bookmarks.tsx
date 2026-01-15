import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing, radii, iconSizes } from '@/theme/Theme';
import { useApp } from '@/context/AppContext';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - spacing.lg * 3) / 2;

export default function BookmarksScreen() {
  const router = useRouter();
  const { bookmarkedPhotos, monthGroups } = useApp();

  const bookmarkedItems = React.useMemo(() => {
    const allPhotos = monthGroups.flatMap(g => g.photos);
    return allPhotos.filter(p => bookmarkedPhotos.includes(p.id));
  }, [monthGroups, bookmarkedPhotos]);

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }: { item: typeof bookmarkedItems[0] }) => (
    <View style={styles.gridItem}>
      <Image
        source={{ uri: item.uri }}
        style={styles.gridImage}
        contentFit="cover"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={iconSizes.md} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bookmarks</Text>
          <View style={styles.headerSpacer} />
        </View>

        {bookmarkedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bookmark size={64} color={colors.pinkMid} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the bookmark icon while swiping to save photos here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookmarkedItems}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContent}
            columnWrapperStyle={styles.gridRow}
          />
        )}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  gridContent: {
    padding: spacing.lg,
  },
  gridRow: {
    gap: spacing.lg,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
});
