import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, typography, spacing, radii, iconSizes } from '@/theme/Theme';

const faqs = [
  {
    question: 'How does SwipeAway work?',
    answer: 'SwipeAway lets you quickly organize your photo library by swiping through photos one at a time. Swipe right to keep a photo, swipe left to delete it. It is that simple!',
  },
  {
    question: 'Are my photos deleted immediately?',
    answer: 'Photos you swipe left on are moved to your Recently Deleted folder in the Photos app. They will stay there for 30 days before being permanently removed, giving you time to recover any photos you deleted by mistake.',
  },
  {
    question: 'Can I undo a swipe?',
    answer: 'Yes! Tap the undo button in the top right corner of the swipe screen to go back to the previous photo and change your decision.',
  },
  {
    question: 'What are bookmarks?',
    answer: 'Bookmarks let you save photos you want to revisit later. Tap the bookmark icon while swiping to add a photo to your bookmarks. You can view all your bookmarked photos in the Menu.',
  },
  {
    question: 'Is my data safe?',
    answer: 'Absolutely! Your photos never leave your device. SwipeAway processes everything locally and does not upload your photos to any servers.',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription at any time through your device Settings > Apple ID > Subscriptions. Your access will continue until the end of your current billing period.',
  },
];

export default function FAQScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleBack = () => {
    router.back();
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={iconSizes.md} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.8}
            >
              <View style={styles.questionRow}>
                <Text style={styles.question}>{faq.question}</Text>
                {expandedIndex === index ? (
                  <ChevronUp size={24} color={colors.textPrimary} />
                ) : (
                  <ChevronDown size={24} color={colors.textPrimary} />
                )}
              </View>
              {expandedIndex === index && (
                <Text style={styles.answer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  faqItem: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.md,
  },
  answer: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 24,
  },
});
