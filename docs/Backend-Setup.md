# Backend setup (ShopEase API)

NestJS + PostgreSQL API for vendor signup, sign-in, store setup, Cloudinary uploads, support tickets, and SendChamp notifications.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local install recommended for production)
- [Cloudinary](https://cloudinary.com/) account (product images)
- [SendChamp](https://sendchamp.com/) account (SMS + email notifications)

## Quick start (development)

### 1. Start PostgreSQL

Use a local PostgreSQL instance (Windows often uses port **5433** if 5432 is taken). Update `DATABASE_URL` in `api/.env`.

Docker is optional for local dev only:

```bash
docker compose up -d
```

### 2. Configure API

```bash
cd api
cp .env.example .env
npm install
npx prisma migrate deploy
npm run start:dev
```

Fill in Cloudinary and SendChamp keys in `api/.env` when you need uploads or notifications. The API starts without them but uploads/notifications will be skipped or fail gracefully.

API runs at `http://localhost:3001`.

### 3. Configure frontend

```bash
cd app
cp .env.example .env
```

Set in `app/.env`:

```
VITE_USE_API=true
VITE_API_URL=/api
```

```bash
npm run dev
```

Frontend runs at `http://localhost:3000` and proxies `/api` to the backend. Product images are served from Cloudinary CDN URLs (no local `/uploads` proxy).

## Environment variables

### API (`api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | No | Token TTL (default `7d`) |
| `PORT` | No | API port (default `3001`) |
| `CORS_ORIGIN` | No | Frontend origin (default `http://localhost:3000`) |
| `CLOUDINARY_CLOUD_NAME` | For uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For uploads | Cloudinary API secret |
| `CLOUDINARY_FOLDER` | No | Upload folder prefix (default `shopoint/products`) |
| `SENDCHAMP_API_KEY` | For notifications | SendChamp bearer token |
| `SENDCHAMP_MODE` | No | `test` (sandbox) or `live` |
| `SENDCHAMP_SMS_SENDER` | No | SMS sender name (default `ShopEase`) |
| `SENDCHAMP_FROM_EMAIL` | No | From email for verification emails |
| `SENDCHAMP_FROM_NAME` | No | From name for verification emails |

### Cloudinary setup

1. Create a Cloudinary account and note cloud name, API key, and secret.
2. Add the three `CLOUDINARY_*` vars to `api/.env`.
3. Product uploads go to `{CLOUDINARY_FOLDER}/{vendorId}/` and return a full HTTPS URL stored on the product.

### SendChamp setup

1. Copy your API key from the SendChamp dashboard.
2. Set `SENDCHAMP_MODE=test` for sandbox or `live` for production.
3. Register an SMS sender ID in SendChamp (or use the default in test mode).

**Notifications sent:**

| Event | Channel | Recipient |
|-------|---------|-----------|
| Forgot password | SMS | Vendor phone (6-digit OTP) |
| Order status change | SMS | Buyer phone (skips initial `paid` status) |
| Ticket resolved | SMS | Ticket submitter phone |
| Verification approved/rejected | Email | Vendor email (if set on account) |

## Vendor flow

1. **Sign up** — `POST /auth/signup` (optional `email` for verification emails) → JWT saved in browser
2. **Store setup** — `PUT /stores/me`, then `POST /stores/me/complete-setup`
3. **Sign in** — `POST /auth/signin` → redirect to dashboard or setup
4. **Forgot password** — `POST /auth/forgot-password` → SMS OTP → `POST /auth/reset-password`

## Support tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/support/tickets` | No (rate-limited) | Customer/guest ticket |
| POST | `/support/tickets/vendor` | Bearer (vendor) | Vendor ticket (auto-fills store name) |
| GET | `/admin/tickets` | Admin | List all tickets |
| PATCH | `/admin/tickets/:id` | Admin | Update status / priority |

When a ticket is marked `resolved`, the submitter receives an SMS via SendChamp.

## Admin access

Set `role = admin` on your user in PostgreSQL:

```sql
UPDATE "User" SET role = 'admin' WHERE phone = '08012345678';
```

## API endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | No | Create vendor account |
| POST | `/auth/signin` | No | Sign in |
| POST | `/auth/forgot-password` | No | Send password reset OTP (SMS) |
| POST | `/auth/reset-password` | No | Reset password with OTP |
| GET | `/auth/me` | Bearer | Current user |
| POST | `/auth/signout` | Bearer | Sign out (client clears token) |

### Stores & products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stores/me` | Bearer | Vendor store |
| PUT | `/stores/me` | Bearer | Save store draft |
| POST | `/stores/me/complete-setup` | Bearer | Finish setup |
| GET | `/stores/slug/:slug/available` | No | Slug availability |
| GET | `/stores/public/:slug` | No | Public storefront data |
| GET | `/stores/me/products` | Bearer | List vendor products |
| POST | `/stores/me/products` | Bearer | Create product |
| PUT | `/stores/me/products/:id` | Bearer | Update product |
| DELETE | `/stores/me/products/:id` | Bearer | Delete product |
| GET | `/stores/public/:slug/products` | No | Published products |
| GET | `/stores/public/:slug/products/:id` | No | Published product |
| POST | `/uploads/product-image` | Bearer | Upload product image to Cloudinary |

### Orders & reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | No | Create order (guest checkout) |
| GET | `/orders/ref/:paymentRef` | No | Order by payment ref |
| GET | `/stores/me/orders` | Bearer | Vendor orders |
| PATCH | `/stores/me/orders/:id/status` | Bearer | Update order status (buyer SMS on change) |
| POST | `/stores/me/orders/mark-seen` | Bearer | Mark orders seen |
| GET | `/stores/me/orders/unread-count` | Bearer | Unread order count |
| GET | `/stores/public/:slug/reviews` | No | Store reviews |
| GET | `/stores/public/:slug/reviews/summary` | No | Review summary |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/badges` | Admin | Sidebar badge counts |
| GET | `/admin/stats` | Admin | Platform overview stats |
| GET | `/admin/vendors` | Admin | All vendors |
| GET | `/admin/customers` | Admin | Unique customers |
| GET | `/admin/orders` | Admin | All platform orders |
| GET | `/admin/tickets` | Admin | Support tickets |
| PATCH | `/admin/tickets/:id` | Admin | Update ticket status/priority |
| GET | `/admin/verification` | Admin | Pending verification queue |
| POST | `/admin/verification/:vendorId/approve` | Admin | Approve vendor (email if vendor has email) |
| POST | `/admin/verification/:vendorId/reject` | Admin | Reject vendor (email if vendor has email) |
| GET | `/admin/analytics/revenue?preset=7d\|30d\|90d` | Admin | Revenue chart data |
| GET | `/admin/analytics/top-vendors` | Admin | Top vendors by revenue |

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness probe |
| GET | `/health/ready` | No | Readiness probe (PostgreSQL ping) |

## Bare-metal / VPS deployment

Recommended production layout without Docker:

1. **PostgreSQL** — install on the host (e.g. port 5433), create database and user, run `npx prisma migrate deploy` from the API directory.
2. **API** — build with `npm run build`, run with PM2 or systemd on port 3001:

```bash
cd api
npm ci
npm run build
pm2 start dist/main.js --name shopease-api
```

3. **Frontend** — `npm run build` in `app/`, serve `app/dist` via nginx or a CDN. Set `VITE_USE_API=true` and `VITE_API_URL` to your public API URL at build time.
4. **Reverse proxy** — nginx terminates TLS and proxies `/api` (or a subdomain) to the NestJS process.
5. **Secrets** — set `JWT_SECRET`, Cloudinary, and SendChamp vars in the host environment or a protected `.env` file (never commit).

Example nginx location block:

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:3001/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

## Rate limits (per IP)

| Tier | Limit | Routes |
|------|-------|--------|
| default | 100 / min | Most routes |
| auth | 5 / min | `POST /auth/signup`, `POST /auth/signin`, forgot/reset password |
| checkout | 20 / min | `POST /orders`, `POST /uploads/product-image` |

## Running tests

```bash
cd api
npm test
npm run test:e2e
```

## Known limitations

- **Paystack** — mock checkout remains; no webhook verification yet
- **JWT sign-out** — stateless JWT; no server-side token denylist
- **Verification email** — requires vendor `email` on signup or profile (phone-only vendors skip email)
