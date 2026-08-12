import {
  AuthSdk,
  BillingSdk,
  IdentitySdk,
  OAuthSdk,
  TenantSdk,
  VcSdk,
  type ApiError,
  type ApiResponse,
  type User,
} from "@arcevo/facet-sdk";
import { arcIdClient } from "@/services/api-client";

// ── Domain SDKs (facet-sdk classes) ────────────────────────────────────────

export const auth = new AuthSdk(arcIdClient);
export const credentials = new VcSdk(arcIdClient);
export const identity = new IdentitySdk(arcIdClient);
export const tenants = new TenantSdk(arcIdClient);
export const billing = new BillingSdk(arcIdClient);
export const oauth = new OAuthSdk(arcIdClient);

export type { ApiError, ApiResponse, User };
