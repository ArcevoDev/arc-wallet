import * as SecureStore from "expo-secure-store";
import { CompactSign } from "jose";
import { credentials } from "@/sdk";
import { useAuthStore } from "@/stores/auth-store";

const WALLET_KEYPAIR_STORAGE_KEY = "arcwallet-signing-key";

/**
 * Presentation service — implements the ArcID verification protocol
 * (docs/planning/presentation-envelope-design.md).
 *
 *   ArcVerify creates a session -> wallet signs a detached JWS binding
 *   the challenge + sessionId + credential -> POST /verify/present.
 *
 * The proof JWS shape the backend verifies (src/lib/security/jws-proof.ts):
 *   Protected header: { alg, kid: "<did:key>#key-1", nonce: "<challenge>" }
 *   Payload:          { credentialHash: "<sha256>" }
 *   Detached form:    "header..signature" (payload omitted, verifier rebuilds it)
 *
 * The signing key is generated and held on-device (secure store); only
 * the public JWK is ever sent to ArcID (via registerWalletDid) — ArcID
 * never custodies the private key.
 */

async function getOrCreateSigningKey(): Promise<CryptoKeyPair> {
  const existing = await SecureStore.getItemAsync(WALLET_KEYPAIR_STORAGE_KEY);
  if (existing) {
    const { publicKeyJwk, privateKeyJwk } = JSON.parse(existing);
    const publicKey = await crypto.subtle.importKey(
      "jwk", publicKeyJwk, { name: "Ed25519" } as AlgorithmIdentifier, true, [],
    );
    const privateKey = await crypto.subtle.importKey(
      "jwk", privateKeyJwk, { name: "Ed25519" } as AlgorithmIdentifier, true, ["sign"],
    );
    return { publicKey, privateKey } as CryptoKeyPair;
  }

  const keyPair = (await crypto.subtle.generateKey(
    { name: "Ed25519" } as AlgorithmIdentifier,
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;

  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  await SecureStore.setItemAsync(
    WALLET_KEYPAIR_STORAGE_KEY,
    JSON.stringify({ publicKeyJwk, privateKeyJwk }),
  );

  return keyPair;
}

/** The public JWK for this device — send to ArcID via registerWalletDid. */
export async function getPublicKeyJwk(): Promise<JsonWebKey> {
  const keyPair = await getOrCreateSigningKey();
  return crypto.subtle.exportKey("jwk", keyPair.publicKey);
}

// ── did:key derivation (Ed25519) ────────────────────────────────────────────

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function toBase58(input: Uint8Array): string {
  let digits = [0];
  for (const byte of input) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let zeros = 0;
  while (zeros < input.length && input[zeros] === 0) zeros++;
  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += BASE58_ALPHABET[digits[i]];
  return out;
}

/**
 * Derive the device's did:key (Ed25519). Format:
 *   did:key:z6Mk<base58btc(0xed 0x01 <32-byte pubkey>)>
 */
export async function getDeviceDid(): Promise<string> {
  const keyPair = await getOrCreateSigningKey();
  const jwk = (await crypto.subtle.exportKey("jwk", keyPair.publicKey)) as { x?: string };

  // Reconstruct the raw 32-byte Ed25519 public key from the JWK x (base64url).
  const x = jwk.x ?? "";
  const b64u = x.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64u);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  // Multicodec prefix 0xed (Ed25519 public key) + varint length 0x01.
  const prefixed = new Uint8Array(bytes.length + 2);
  prefixed[0] = 0xed;
  prefixed[1] = 0x01;
  prefixed.set(bytes, 2);

  return `did:key:z${toBase58(prefixed)}`;
}

/** SHA-256 hex of a string (for the credentialHash payload). */
async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sign the detached JWS proof: header contains { alg, kid, nonce }, the
 * signed payload is { credentialHash }, and the returned string is
 * "header..signature" (payload stripped).
 */
export async function signPresentationProof(input: {
  challenge: string;
  sessionId: string;
  credential: string;
  did: string;
}): Promise<string> {
  const keyPair = await getOrCreateSigningKey();
  const credentialHash = await sha256Hex(input.credential);

  const payload = new TextEncoder().encode(JSON.stringify({ credentialHash }));
  const jws = await new CompactSign(payload)
    .setProtectedHeader({
      alg: "EdDSA",
      kid: `${input.did}#key-1`,
      nonce: input.challenge,
    })
    .sign(keyPair.privateKey);

  // Detach the payload: "header.payload.signature" -> "header..signature"
  const [header, , signature] = jws.split(".");
  return `${header}..${signature}`;
}

/** Present a credential for verification. Returns the VerificationResult. */
export async function presentCredential(input: {
  sessionId: string;
  challenge: string;
  credential: string;
  did: string;
}) {
  if (!useAuthStore.getState().accessToken) {
    return { data: null, error: { statusCode: 401, error: "Unauthorized", message: "Not signed in" } as const };
  }
  const proof = await signPresentationProof(input);
  return credentials.presentForVerification({
    sessionId: input.sessionId,
    credential: input.credential,
    proof,
  });
}
