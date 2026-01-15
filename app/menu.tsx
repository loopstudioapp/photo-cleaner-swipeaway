import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bookmark, BarChart3, HelpCircle, Mail, Instagram, Star } from 'lucide-react-native';
import { colors, gradients, typography, spacing, iconSizes } from '@/theme/Theme';
import GradientRow from '@/components/GradientRow';

export default function MenuScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleBookmarks = () => {
    router.push('/bookmarks');
  };

  const handleStats = () => {
    router.push('/stats');
  };

  const handleFAQ = () => {
    router.push('/faq');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@swipeaway.app');
  };

  const handleInstagram = () => {
    Linking.openURL('https://instagram.com/swipeaway');
  };

  const handleRate = () => {
    console.log('[MenuScreen] Rate app pressed');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={iconSizes.md} color={colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Menu</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GradientRow
            title="Bookmarks"
            gradientColors={gradients.bookmarks}
            onPress={handleBookmarks}
            leftIcon={<Bookmark size={28} color={colors.white} strokeWidth={2.5} />}
            height={80}
          />

          <GradientRow
            title="My Stats"
            gradientColors={gradients.stats}
            onPress={handleStats}
            leftIcon={<BarChart3 size={28} color={colors.white} strokeWidth={2.5} />}
            height={80}
          />

          <GradientRow
            title="FAQ"
            gradientColors={gradients.faq}
            onPress={handleFAQ}
            leftIcon={<HelpCircle size={28} color={colors.white} strokeWidth={2.5} />}
            height={80}
          />

          <GradientRow
            title="Email Us"
            gradientColors={gradients.email}
            onPress={handleEmail}
            leftIcon={<Mail size={28} color={colors.white} strokeWidth={2.5} />}
            height={80}
          />

          <GradientRow
            title="Instagram"
            gradientColors={gradients.instagram}
            onPress={handleInstagram}
            leftIcon={<Instagram size={28} color={colors.white} strokeWidth={2.5} />}
            height={80}
          />

          <GradientRow
            title="Rate Us"
            gradientColors={gradients.rate}
            onPress={handleRate}
            leftIcon={<Star size={28} color={colors.white} strokeWidth={2.5} />}
            height={80}
          />

          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>Dear Swipe Fam,</Text>
            <Text style={styles.messageBody}>
              Thank you for using SwipeAway! We built this app to help you reclaim your photo library and free up storage space on your device.
              {'\n\n'}
              If you have any questions, feedback, or just want to say hi, please do not hesitate to reach out. We love hearing from our users.
              {'\n\n'}
              Happy swiping! 💕
            </Text>
          </View>
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
    paddingBottom: spacing.xxl,
  },
  messageContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  messageBody: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 26,
  },
});
