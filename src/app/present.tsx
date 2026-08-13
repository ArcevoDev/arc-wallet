import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { credentialService } from '@/services/credentials';
import { getDeviceDid, presentCredential } from '@/services/presentation';
import type { Credential } from '@arcevo/facet-sdk';

/**
 * Presentation screen — reached via the deep link
 * `arcwallet://present?sessionId=…&challenge=…` (from ArcVerify's QR code
 * or deep link). The holder picks a credential, signs a detached JWS
 * proof with their on-device key, and ArcID verifies it.
 */
export default function PresentScreen() {
  const router = useRouter();
  const { sessionId, challenge } = useLocalSearchParams<{ sessionId: string; challenge: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [selected, setSelected] = useState<Credential | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [presenting, setPresenting] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?next=/present?sessionId=${encodeURIComponent(sessionId)}&challenge=${encodeURIComponent(challenge)}`);
      return;
    }
    (async () => {
      const [listRes, storedDid] = await Promise.all([
        credentialService.list(),
        getDeviceDid(),
      ]);
      setLoading(false);
      if (listRes.data) setCredentials(listRes.data);
      if (storedDid) setDid(storedDid);
    })();
  }, [isAuthenticated, router, sessionId, challenge]);

  const handlePresent = async () => {
    if (!selected || !did || !sessionId || !challenge) {
      setError('Missing credential, DID, or session details.');
      return;
    }
    setPresenting(true);
    setError(null);
    const res = await presentCredential({
      sessionId,
      challenge,
      credential: JSON.stringify(selected),
      did,
    });
    setPresenting(false);
    if (res.data) {
      setResult({ valid: res.data.valid, reason: res.data.reason });
    } else {
      setError(res.error?.message ?? 'Presentation failed.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">Present credential</ThemedText>
        <ThemedText themeColor="textSecondary">
          A verifier is asking you to prove you hold a credential.
        </ThemedText>

        {loading ? (
          <ActivityIndicator style={styles.spacer} />
        ) : !credentials || credentials.length === 0 ? (
          <ThemedText themeColor="textSecondary">
            You have no credentials to present.
          </ThemedText>
        ) : (
          <ThemedView style={styles.list}>
            {credentials.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelected(c)}
                style={({ pressed }) => [styles.credentialOption, pressed && styles.pressed]}>
                <ThemedView
                  type={selected?.id === c.id ? 'backgroundSelected' : 'backgroundElement'}
                  style={styles.credentialInner}>
                  <ThemedText type="default" style={styles.credentialTitle}>{c.type}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Issued {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
        )}

        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {result && (
          <ThemedText style={result.valid ? styles.success : styles.error}>
            {result.valid ? '✓ Verified' : `✗ Rejected: ${result.reason ?? 'unknown'}`}
          </ThemedText>
        )}

        {selected && did && !result && (
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            onPress={handlePresent}
            disabled={presenting}>
            {presenting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText style={styles.buttonText}>Present {selected.type}</ThemedText>
            )}
          </Pressable>
        )}

        <Pressable onPress={() => router.replace('/')}>
          <ThemedText type="link">Back to wallet</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  spacer: {
    marginTop: Spacing.five,
  },
  list: {
    gap: Spacing.two,
  },
  credentialOption: {
    width: '100%',
  },
  credentialInner: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  credentialTitle: {
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4AD3F5',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
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
