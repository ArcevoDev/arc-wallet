import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth-store';
import { credentialService } from '@/services/credentials';
import { authService } from '@/services/auth';
import { walletDidService } from '@/services/wallet-did';
import type { Credential } from '@arcevo/facet-sdk';

export default function WalletHomeScreen() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCredentials = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    const result = await credentialService.list();
    setLoading(false);
    if (result.data) setCredentials(result.data);
  }, [accessToken]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  // First-launch DID registration: if signed in with no registered DID,
  // route to /did so the wallet can present credentials.
  useEffect(() => {
    if (!isAuthenticated) return;
    walletDidService.hasRegisteredDid().then((registered) => {
      if (!registered) router.replace('/did');
    });
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">ArcWallet</ThemedText>
          <ThemedText themeColor="textSecondary">
            {isAuthenticated && user ? `Signed in as ${user.name || user.email}` : 'Not signed in'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Credentials</ThemedText>
          {loading ? (
            <ThemedText themeColor="textSecondary">Loading…</ThemedText>
          ) : !credentials || credentials.length === 0 ? (
            <ThemedText themeColor="textSecondary">
              No credentials yet. Accept an offer from a trusted issuer to hold it here.
            </ThemedText>
          ) : (
            credentials.map((c) => (
              <ThemedView key={c.id} type="backgroundElement" style={styles.credentialCard}>
                <ThemedText type="default" style={styles.credentialTitle}>{c.type}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Issued {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}
                  {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                </ThemedText>
              </ThemedView>
            ))
          )}
        </ThemedView>

        {isAuthenticated && (
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
            onPress={handleLogout}>
            <ThemedText style={styles.logoutText}>Sign out</ThemedText>
          </Pressable>
        )}
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
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.three,
  },
  credentialCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  credentialTitle: {
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#FF453A',
  },
  logoutText: {
    color: '#FF453A',
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
