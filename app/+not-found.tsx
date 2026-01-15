import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "@/theme/Theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>This screen does not exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go back home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.pinkBase,
  },
  title: {
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  link: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: 999,
  },
  linkText: {
    fontSize: typography.body.fontSize,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
