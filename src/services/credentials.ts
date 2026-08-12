import { credentials } from "@/sdk";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Credential service — thin wrapper over VcSdk for the wallet's
 * credential management: list held credentials, accept offers, and
 * present via the verification protocol.
 */
export const credentialService = {
  async list() {
    if (!useAuthStore.getState().accessToken) {
      return { data: null, error: { statusCode: 401, error: "Unauthorized", message: "Not signed in" } as const };
    }
    return credentials.list();
  },

  async acceptOffer(token: string) {
    if (!useAuthStore.getState().accessToken) {
      return { data: null, error: { statusCode: 401, error: "Unauthorized", message: "Not signed in" } as const };
    }
    return credentials.acceptOffer(token);
  },

  async createVerificationSession(credentialRef?: string) {
    return credentials.createVerificationSession(credentialRef);
  },

  async presentForVerification(data: {
    sessionId: string;
    challenge: string;
    credential: string;
    proof: string;
  }) {
    return credentials.presentForVerification(data);
  },

  async getStatusList(id: string) {
    return credentials.getStatusList(id);
  },
};
