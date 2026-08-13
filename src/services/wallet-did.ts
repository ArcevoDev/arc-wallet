import * as SecureStore from "expo-secure-store";
import { identity } from "@/sdk";
import { useAuthStore } from "@/stores/auth-store";
import { getDeviceDid, getPublicKeyJwk } from "@/services/presentation";

const WALLET_KEY_STORAGE_KEY = "arcwallet-did";

/**
 * Wallet DID service — registers the identity-owned did:key on first
 * launch (non-custodial: the private key never leaves the device).
 *
 * The SDK's registerWalletDid accepts a public key JWK + provider +
 * providerWalletId. The wallet generates the keypair (see
 * presentation.ts), derives the did:key, and sends ONLY the public JWK —
 * ArcID never custodies the private key.
 */
export const walletDidService = {
  /** True if this device already registered a DID with ArcID. */
  async hasRegisteredDid(): Promise<boolean> {
    const stored = await SecureStore.getItemAsync(WALLET_KEY_STORAGE_KEY);
    return stored !== null;
  },

  /** The full did:key this device presents with. */
  async getRegisteredDid(): Promise<string | null> {
    const stored = await SecureStore.getItemAsync(WALLET_KEY_STORAGE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored).did as string;
    } catch {
      return null;
    }
  },

  /**
   * Register the wallet DID with ArcID. Generates/loads the device
   * keypair, sends the public JWK, and remembers the resulting did:key.
   */
  async register(): Promise<string> {
    if (!useAuthStore.getState().accessToken) {
      throw new Error("Not signed in — cannot register wallet DID");
    }

    const providerWalletId = await this.getOrCreateDeviceId();
    const [publicKeyJwk, did] = await Promise.all([getPublicKeyJwk(), getDeviceDid()]);

    const result = await identity.registerWalletDid({
      publicKeyJwk: publicKeyJwk as unknown as Parameters<typeof identity.registerWalletDid>[0]["publicKeyJwk"],
      provider: "arc-wallet",
      providerWalletId,
    });

    if (result.error) {
      throw new Error(result.error.message ?? "Failed to register wallet DID");
    }

    // Remember the registration so we don't re-register every launch.
    await SecureStore.setItemAsync(
      WALLET_KEY_STORAGE_KEY,
      JSON.stringify({ providerWalletId, did }),
    );

    return did;
  },

  /** Stable per-device id used as the wallet's provider id. */
  async getOrCreateDeviceId(): Promise<string> {
    const existing = await SecureStore.getItemAsync("arcwallet-device-id");
    if (existing) return existing;
    const id = `wallet-${Math.random().toString(36).slice(2, 10)}`;
    await SecureStore.setItemAsync("arcwallet-device-id", id);
    return id;
  },
};
