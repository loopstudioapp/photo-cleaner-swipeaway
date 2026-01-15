import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { colors, typography, spacing, radii } from '@/theme/Theme';

type SortOrder = 'mostRecent' | 'leastRecent' | 'mostPhotos' | 'fewestPhotos';

interface SortOverlayProps {
  visible: boolean;
  currentSort: SortOrder;
  hideCompleted: boolean;
  onSortSelect: (sort: SortOrder) => void;
  onHideCompletedSelect: (hide: boolean) => void;
  onClose: () => void;
}

const sortOptions: { key: SortOrder; label: string }[] = [
  { key: 'mostRecent', label: 'most recent' },
  { key: 'leastRecent', label: 'least recent' },
  { key: 'mostPhotos', label: 'most photos' },
  { key: 'fewestPhotos', label: 'fewest photos' },
];

const hideOptions: { key: boolean; label: string }[] = [
  { key: false, label: 'no' },
  { key: true, label: 'yes' },
];

export default function SortOverlay({ 
  visible, 
  currentSort, 
  hideCompleted,
  onSortSelect, 
  onHideCompletedSelect,
  onClose 
}: SortOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>sort your list of months by:</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.option}
                onPress={() => onSortSelect(option.key)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentSort === option.key && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>hide completed months:</Text>
            {hideOptions.map((option) => (
              <TouchableOpacity
                key={String(option.key)}
                style={styles.option}
                onPress={() => onHideCompletedSelect(option.key)}
              >
                <Text
                  style={[
                    styles.optionText,
                    hideCompleted === option.key && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  container: {
    marginTop: 120,
    marginRight: spacing.lg,
  },
  content: {
    backgroundColor: colors.pinkBase,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minWidth: 220,
  },
  sectionTitle: {
    fontSize: typography.small.fontSize,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  sectionTitleMargin: {
    marginTop: spacing.lg,
  },
  option: {
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  optionText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
