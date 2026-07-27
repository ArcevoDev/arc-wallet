# ArcWallet

Self-sovereign identity wallet for the ArcevoCirqle ecosystem. Built with Expo 57 + React Native 0.86, ArcWallet connects to the [ArcID](https://github.com/arcevodev/arc-id) identity and access management backend for decentralized identity, verifiable credentials, and secure authentication.

## Overview

ArcWallet is a mobile-first wallet that lets users:

- **Authenticate** — login, register, passkeys (WebAuthn), TOTP MFA, magic-link, social login
- **Hold credentials** — receive, store, and display SD-JWT Verifiable Credentials issued by trusted parties
- **Prove identity** — present credentials via QR-based challenge-response verification (W3C BitstringStatusList)
- **Manage DIDs** — self-owned `did:key` and `did:web` identifiers, registered through ArcID's wallet DID flow
- **Onboard seamlessly** — step-by-step setup flow powered by ArcID's built-in onboarding system (flow definitions + progress tracking on backend, wallet only renders the UI)
- **Stay secure** — biometric auth, session management, step-up authentication for sensitive operations

## Architecture

```
┌─────────────────┐     HTTP      ┌──────────────────────┐
│   ArcWallet     │ ──────────▶   │   ArcID Backend      │
│   (React Native)│ ◀──────────   │   (Fastify + Prisma)  │
│   Expo 57       │   SDK/JSON    │   PostgreSQL + Redis  │
└─────────────────┘               └──────────────────────┘
```

ArcWallet consumes ArcID's typed SDK — a pure TypeScript fetch client with automatic token refresh, covering auth, credentials, DIDs, tenants, and more. No framework dependencies, designed for portability.

## Prerequisites

- Node.js >= 22
- pnpm >= 9
- [ArcID](https://github.com/arcevodev/arc-id) backend running locally (or a shared dev instance)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the Expo dev server
pnpm start
```

The wallet expects the ArcID API at `http://localhost:4000/api/v1` by default. Configure via `NEXT_PUBLIC_API_URL` environment variable for other environments.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Expo dev server |
| `pnpm android` | Start on Android emulator |
| `pnpm ios` | Start on iOS simulator |
| `pnpm web` | Start on web browser |
| `pnpm snapshot` | Generate codebase snapshot for AI agents |

## Project Structure

```
src/
├── app/           # expo-router screens (file-based routing)
│   ├── (auth)/       # Authentication screens (login, register, MFA, passkey)
│   ├── (onboarding)/ # First-launch onboarding flow (welcome, features, setup)
│   └── (app)/        # Wallet screens (dashboard, credentials, DID, settings)
├── components/    # Reusable UI and wallet components
├── services/      # ArcID SDK clients and business logic
├── stores/        # Zustand state management
├── hooks/         # Custom React hooks
├── constants/     # Theme, spacing, configuration
└── types/         # Shared TypeScript types
```

## Related

- [ArcID](https://github.com/arcevodev/arc-id) — Sovereign identity & access management backend
