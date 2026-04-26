# ZEROVPN

Production-ready Next.js SaaS for legal VPN access: public site, account area, admin panel, manual bank transfer flow, PasarGuard issuing, trial, tickets, FAQ, news, service status, fundraisers, email/push infrastructure and Docker/Caddy deployment.

## Install

1. Point an A record for your domain to the server.
2. Install Docker and Docker Compose.
3. Run:

```bash
chmod +x install.sh update.sh backup.sh restore.sh
./install.sh
```

The installer asks for the domain, SSL email, first admin, service name, payment phone, banks, PasarGuard URL/credentials, SMTP, Telegram and trial days. It generates `.env`, secrets, database password and starts Docker Compose. Caddy listens on ports `80` and `443` and issues Let's Encrypt certificates automatically.

Site: `https://your-domain`  
Admin: `https://your-domain/admin`

If setup was not completed by the script, open `/setup`.

## Manual Payment Flow

User chooses a plan and bank, sees amount and phone number, transfers manually, then clicks `Я оплатил`. The order becomes `payment_review`. Admin confirms or rejects in `/admin`. Confirmation moves the order to `paid`, then `issuing`, then calls PasarGuard. Success stores `subscriptionUrl` and QR code. Failures become `issue_failed` with an admin retry button.

Order statuses: `pending_payment`, `payment_review`, `paid`, `rejected`, `issuing`, `issued`, `issue_failed`, `expired`, `refunded`.

Idempotency is handled by `idempotencyKey`, status guards and PasarGuard username reuse.

## PasarGuard Integration

Investigated sources:

- Official docs: `https://docs.pasarguard.org/en/panel/`
- Panel source: `https://github.com/PasarGuard/panel`

Found endpoints:

- `POST /api/admin/token` with OAuth2 form fields `username`, `password`; returns `access_token`.
- `POST /api/user/from_template` with `{ username, user_template_id, note }`; creates a user from a template.
- `PUT /api/user/from_template/{username}` applies a template to an existing user.
- `PUT /api/user/{username}` updates user fields such as `status`, `expire`, `data_limit`, `note`.
- `GET /api/user/{username}` reads user info.
- `POST /api/user/{username}/revoke_sub` revokes subscription link.
- Subscription URL is returned as `subscription_url` in user responses; panel generates it from subscription settings and token.

ZEROVPN keeps all HTTP calls in:

- `lib/pasarguard/PasarGuardClient.ts`
- `lib/pasarguard/PasarGuardService.ts`
- `lib/pasarguard/pasarguard.types.ts`

Admin settings required for production mode:

- PasarGuard base URL, for example `https://panel.example.com:8000`
- Admin username/password or token
- User template ID
- Mode: `production`

If any required value is missing, use `mock` mode. Mock mode generates a safe fake subscription URL and logs the action. This is intentionally isolated inside `PasarGuardService`.

Renewal behavior: if the user has an active subscription, ZEROVPN extends from the current `endsAt`; otherwise it starts from now. It reuses the PasarGuard username where possible.

## SMTP and Push

Configure SMTP in `/admin`: host, port, user, password and from email. Passwords are encrypted in DB with `ENCRYPTION_KEY`.

Push subscriptions are stored via `/api/push/subscribe`. Add VAPID keys in `/admin`. The service worker lives at `/sw.js`.

## Admin Tasks

Use `/admin` to:

- confirm/reject manual payments;
- retry failed issuing;
- edit payment phone, banks and instructions;
- switch PasarGuard mock/production;
- configure SMTP and push;
- edit service status;
- create plans, news, FAQ, instructions and fundraisers;
- reply to support tickets;
- review users, subscriptions and integration logs.

## Backup, Restore, Update

```bash
./backup.sh
./restore.sh backups/zerovpn-YYYYmmdd-HHMMSS.sql
./update.sh
```

## Future Platega

Payment logic is behind `lib/payments/PaymentProvider.ts`. Current provider is `ManualTransferProvider`. A future `PlategaProvider` can create/update the same `Order` model and reuse the common business rule: `payment confirmed -> issue subscription`.

## Security Notes

- No hardcoded secrets.
- Admin passwords are bcrypt hashes.
- User login is passwordless email code with expiry, attempt limits and DB-backed rate limit.
- Session cookies are httpOnly and secure in production.
- Settings secrets are AES-256-GCM encrypted.
- PasarGuard/SMTP tokens are never returned to the frontend.
- Admin actions are recorded in `AuditLog`.
