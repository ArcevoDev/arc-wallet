import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { walletDidService } from '@/services/wallet-did';

/**
 * DID registration screen — shown on first launch after sign-in.
 * Registers the device's did:key with ArcID (public key only, non-custodial)
 * so the wallet can present credentials for verification.
 */
export default function DidScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [loading, setLoading] = useState(true);
  const [did, setDid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    const existing = await walletDidService.getRegisteredDid();
    if (existing) {
      setDid(existing);
      setLoading(false);
      return;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    check();
  }, [isAuthenticated, router, check]);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const registered = await walletDidService.register();
      setDid(registered);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to register DID.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Your wallet identity</ThemedText>
        <ThemedText themeColor="textSecondary">
          ArcWallet uses a device-held key to sign verifiable presentations.
          Register it with ArcID so verifiers can resolve your identity — your
          private key never leaves this device.
        </ThemedText>

        {loading ? (
          <ActivityIndicator style={styles.spacer} />
        ) : did ? (
          <>
            <ThemedView type="backgroundElement" style={styles.didBox}>
              <ThemedText type="small" themeColor="textSecondary">did:key</ThemedText>
              <ThemedText type="code" style={styles.didText}>{did}</ThemedText>
            </ThemedView>
            <ThemedText style={styles.success}>✓ Registered</ThemedText>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              onPress={handleContinue}>
              <ThemedText style={styles.buttonText}>Continue to wallet</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            {error && <ThemedText style={styles.error}>{error}</ThemedText>}
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <ThemedText style={styles.buttonText}>Register my DID</ThemedText>
              )}
            </Pressable>
            <Pressable onPress={handleContinue}>
              <ThemedText type="link">Skip for now</ThemedText>
            </Pressable>
          </>
        )}
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
  spacer: {
    marginTop: Spacing.five,
  },
  didBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignSelf: 'stretch',
    gap: Spacing.one,
  },
  didText: {
    fontSize: 12,
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#4AD3F5',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
  error: {
    color: '#FF453A',
  },
  success: {
    color: '#30D158',
  },
  pressed: {
    opacity: 0.7,
  },
});
