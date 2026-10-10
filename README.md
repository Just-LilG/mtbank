# UBEX BANK practice app

Click-through screens for a customer phone and a staff desk.

Open the home page, pick a door, and walk the screens. The numbers are samples. No real account is checked, and no money moves.
# mtbank

## Face / fingerprint sign-in (passkeys)

Customers can turn this on in Settings. It uses WebAuthn passkeys: the phone checks the face or
fingerprint itself and only a public key is stored in the `passkeys` table (`db/migrations/002_passkeys.sql`).

- Run `npm install` after pulling (adds `@simplewebauthn/server` and `@simplewebauthn/browser`).
- A passkey only works on the exact site it was made on. Set `APP_ORIGIN` (for example
  `https://your-bank.vercel.app`) in Vercel so it is the same for every deployment. Leave it unset
  locally and the app uses the address it is opened on.
- Staff keep using email and password.

## Savings goals, payment requests, scheduled transfers

- Run `npm install` after pulling (adds `qrcode-generator` for the request QR codes).
- Database tables: `db/migrations/005_goals_requests_schedules.sql` (already applied to Neon).
- Scheduled transfers run from a Vercel Cron job (`vercel.json`, every day at 06:00 UTC) that calls
  `/api/cron/scheduled`. Set `CRON_SECRET` in Vercel; Vercel sends it automatically and the route refuses
  any call without it. A schedule only creates a normal send request, so the branch still approves it and
  every limit still applies.
- Goals do not move money. They mark part of savings as set aside, and Move will not take that part out.
