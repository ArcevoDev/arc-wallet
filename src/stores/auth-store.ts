import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User } from "@arcevo/facet-sdk";

export const TOKEN_STORAGE_KEY = "arcwallet-auth";

interface PersistedSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, sessionId?: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  /** Persist the current session to the secure store. */
  persist: () => Promise<void>;
  /** Restore a persisted session on launch. Returns true if one was found. */
  restore: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  sessionId: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken, sessionId) =>
    set({ user, accessToken, refreshToken, sessionId: sessionId ?? null, isAuthenticated: true, isLoading: false }),

  setUser: (user) => set({ user }),

  setTokens: (accessToken, refreshToken) =>
    set((state) => ({
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
      isAuthenticated: state.isAuthenticated || accessToken !== null,
    })),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      sessionId: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  persist: async () => {
    const { user, accessToken, refreshToken, sessionId } = get();
    if (!user || !accessToken || !refreshToken) return;
    const session: PersistedSession = { user, accessToken, refreshToken, sessionId: sessionId ?? undefined };
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, JSON.stringify(session));
  },

  restore: async () => {
    try {
      const raw = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as PersistedSession;
      if (!parsed.accessToken || !parsed.user) return false;
      set({
        user: parsed.user,
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        sessionId: parsed.sessionId ?? null,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch {
      // Corrupt or unreadable session — treat as logged out.
      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY).catch(() => {});
      return false;
    }
  },
}));
