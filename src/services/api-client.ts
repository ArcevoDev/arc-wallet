import { ArcIdClient, AuthSdk } from "@arcevo/facet-sdk";
import { useAuthStore } from "@/stores/auth-store";

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

let authSdk: AuthSdk;
let refreshInFlight = false;

const client = new ArcIdClient({
  baseUrl: BASE_URL,
  onTokenRefresh: async () => {
    const state = useAuthStore.getState();
    if (!state.refreshToken || refreshInFlight) return null;

    refreshInFlight = true;
    try {
      const { data, error } = await authSdk.refresh(state.refreshToken);
      if (error || !data?.accessToken) {
        useAuthStore.getState().clearAuth();
        return null;
      }
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      useAuthStore.getState().persist();
      return data.accessToken;
    } finally {
      refreshInFlight = false;
    }
  },
  onAuthCleared: () => {
    useAuthStore.getState().clearAuth();
  },
});

// Lazily created so the refresh hook can use it (avoiding a circular import
// between api-client and the SDK wiring).
authSdk = new AuthSdk(client);

export const arcIdClient = client;
