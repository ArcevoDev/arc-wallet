# ArcWallet × ArcID Integration Plan

## Overview

ArcWallet is an Expo 57 + React Native 0.86 mobile wallet — currently a blank starter template. ArcID is a complete sovereign identity backend with 351+ passing tests, ready to be consumed.

## Onboarding System (ArcID-built, wallet-consumed)

ArcID already has a complete onboarding architecture — the wallet **does not reimplement** tracking logic, only renders the frontend steps.

**Backend owns:**
- `OnboardingFlow` model — belongs to a Project, stores ordered steps as JSON
- `OnboardingProgress` model — tracks user position: `currentStep`, `completedSteps[]`, `completedAt`, collected data
- Admin CRUD routes — define flows per project via admin dashboard
- User-facing routes — `POST /identity/onboarding/start`, `POST .../advance`, `GET .../:progressId`
- Idempotent start — calling twice returns same progress
- `completedAt` auto-sets when all steps are done

**Wallet owns:**
- `services/onboarding.ts` — SDK wrapper for the 3 user-facing routes
- `app/(onboarding)/` — stepper screens with step renderers
- Step types the wallet can render: WelcomeCard, FeatureHighlight, ActionPrompt, FormStep, BiometricSetup, CredentialIntro

## What ArcID Exposes (SDK)

The ArcID SDK (`../arc-id/src/sdk/`) is pure TypeScript — no framework deps. It provides typed clients for:

| SDK | Key Methods |
|-----|-------------|
| **auth** | login, register, logout, me, refresh, sessions, MFA, passkey, step-up |
| **passkey** | register/authenticate via WebAuthn |
| **credentials** | issue, verify, revoke, offer SD-JWT VCs |
| **identity** | profile, admin, wallet-did |
| **oauth** | client management, token management |
| **tenant** | get/create, switch-context |
| **billing** | get subscription |
| **webhooks** | CRUD endpoints |
| **audit** | query logs |
| **onboarding** | start, advance, get progress *(SDK wrapper not yet in arc-id, wallet creates it)* |

## Build Phases

### Phase 1 — Auth, SDK Foundation & Onboarding

**Dependencies:**
- zustand, expo-secure-store, expo-camera

**Services (port from arc-id SDK):**
- `services/api-client.ts` — pure fetch client with 401 auto-refresh
- `services/auth.ts` — login, register, logout, me, sessions, MFA, step-up
- `services/passkey.ts` — WebAuthn registration/authentication
- `services/onboarding.ts` — wrapper for ArcID's 3 onboarding routes

**Stores:**
- `stores/auth-store.ts` — port arc-id Zustand auth store
- `stores/onboarding-store.ts` — local onboarding completion state

**Auth screens — `app/(auth)/`:**
- login, register, MFA verify, passkey, forgot-password, reset-password

**Onboarding screens — `app/(onboarding)/`:**
- Welcome — app overview card
- Features — highlight credentials, DID, security capabilities
- Biometric — passkey/biometric setup prompt
- Credential Intro — what are VCs and how they work
- Complete — transition into wallet dashboard
- Stepper layout with ProgressDots and SkipButton

**Logic:** After register or first launch → check onboarding progress → show onboarding if no completed flow → advance per step

### Phase 2 — Wallet Core (Credentials)
- Wallet dashboard with credential display (needs `GET /credentials` in arc-id)
- Credential issue/verify/offer flows
- QR scanning (expo-camera) for credential presentations
- SD-JWT VC display and verification

### Phase 3 — DID & Identity
- Register wallet DID on first launch (`POST /identity/wallet-did`)
- Display did:key or did:web
- DID document retrieval and resolution

### Phase 4 — Full Integration
- Tenant context switching
- OAuth client management
- Webhook subscription management
- Audit log query
- Billing/subscription display

## Backend Gaps
- `GET /credentials` not implemented (blocker for Phase 2)
- `GET /identity/:id` not implemented (low priority, use DID doc endpoint)

## Architecture
- Zustand stores (matches arc-id pattern)
- Pure fetch SDK client with 401 auto-refresh
- expo-secure-store for token persistence
- expo-router groups: `(auth)`, `(onboarding)`, `(app)`
- ArcID backend owns flow definitions + progress — wallet only renders
