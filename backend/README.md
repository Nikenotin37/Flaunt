# FLAUNT backend

Express API for server-only PayU payments, Shiprocket shipping, and Supabase-backed notifications. Deploy the `backend/` directory as its own Railway service.

## Local setup

```bash
cd backend
copy .env.example .env
npm install
npm start
```

`SUPABASE_SERVICE_KEY`, `PAYU_SALT`, and Shiprocket credentials are server secrets. Never put them in the Expo app or commit `.env`.

## Routes

- `GET /health`
- `POST /api/payments/create-order` — authenticated buyer
- `POST|GET /api/payments/success` — PayU callback
- `POST|GET /api/payments/failure` — PayU callback
- `POST /api/payments/refund` — authenticated buyer or seller
- `POST /api/shipping/create` — authenticated seller
- `POST /api/shipping/assign-courier` — authenticated seller
- `GET /api/shipping/track/:awbCode` — authenticated user
- `GET /api/shipping/couriers` — authenticated user
- `GET /api/notifications` — authenticated user
- `GET /api/notifications/unread-count` — authenticated user
- `PATCH /api/notifications/:id/read` — authenticated user
- `PATCH /api/notifications/read-all` — authenticated user

Authenticated requests use the Expo Supabase access token:

```text
Authorization: Bearer <supabase-access-token>
```

The payment route derives the price and seller from the product/store records. It does not trust buyer, seller, or price values sent by the client.
