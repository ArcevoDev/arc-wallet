import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { credentialService } from '@/services/credentials';

/**
 * Offer accept screen — reached via the deep link `arcwallet://offer?token=…`
 * (the token is the one-time offer token from the issuer). Confirms with the
 * user, calls VcSdk.acceptOffer, then returns to the wallet home.
 */
export default function OfferScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const accept = useCallback(async () => {
    if (!token) {
      setError('Missing offer token in the link.');
      return;
    }
    if (!isAuthenticated) {
      router.replace(`/login?next=/offer?token=${encodeURIComponent(token)}`);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await credentialService.acceptOffer(token);
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? 'Failed to accept offer.');
      return;
    }
    setDone(true);
  }, [token, isAuthenticated, router]);

  useEffect(() => {
    accept();
  }, [accept]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        {done ? (
          <>
            <ThemedText type="title">Offer accepted</ThemedText>
            <ThemedText themeColor="textSecondary">
              The credential has been added to your wallet.
            </ThemedText>
          </>
        ) : error ? (
          <>
            <ThemedText type="title">Could not accept offer</ThemedText>
            <ThemedText themeColor="textSecondary">{error}</ThemedText>
          </>
        ) : (
          <>
            <ThemedText type="title">Accepting offer…</ThemedText>
            {loading && <ActivityIndicator />}
          </>
        )}

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => router.replace('/')}>
          <ThemedText style={styles.buttonText}>Back to wallet</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  button: {
    backgroundColor: '#4AD3F5',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
