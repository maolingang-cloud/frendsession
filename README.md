# Frendseesion MVP

Mobile-first P2P WebRTC chat MVP with QR join, timed paid media unlocks, and a WeChat-inspired interface.

## Workspace

- `apps/web`: Next.js PWA frontend
- `apps/api`: NestJS business API with Prisma schema and mock auth/payment flows
- `apps/realtime`: Socket.IO signaling and room event service
- `packages/shared`: shared types, contracts, and session state machine
- `infra/docker`: local Postgres, Redis, MinIO, and coturn stack

## Quick Start

1. Copy `.env.example` to `.env`.
2. Start infrastructure with `pnpm infra:up`.
3. Install dependencies with `pnpm install`.
4. Generate Prisma client with `pnpm prisma:generate`.
5. Start services in separate terminals:
   - `pnpm dev:api`
   - `pnpm dev:realtime`
   - `pnpm dev:web`

## Core Flow

1. Initiator logs in with a mock phone code.
2. Initiator creates a 1-to-1 session and gets a QR join link.
3. Guest scans the QR link and joins anonymously.
4. Guest starts in a free 3-minute text-only window.
5. Initiator creates a payment request for media capabilities and duration.
6. Guest confirms mock payment to unlock media and start the paid countdown.
7. When paid time ends, the session falls back to a final free text window.
8. When the free window ends, the guest is removed and the session becomes expired.

## Notes

- Payments and SMS are mocked behind provider-friendly interfaces.
- Object storage is modeled as S3-compatible signed uploads using MinIO in local development.
- WebRTC signaling flows through the realtime service; media stays peer-to-peer and should use STUN/TURN in development and production.
