# Gokyo Bistro Backend

Node.js + Express backend for Gokyo Bistro.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill database credentials and JWT secret.
3. Run `npm install`.
4. Start the server with `npm start`.

## Environment Variables

```
PORT=5000
CLIENT_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gokyo_bistro
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
gokyo-backend/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
└── routes/
    ├── admin.js
    ├── auth.js
    ├── bookings.js
    ├── menu.js
    └── orders.js
```

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/bookings`
- `GET /api/bookings/my-bookings`
- `GET /api/bookings/:id`
- `PUT /api/bookings/:id/cancel`
- `POST /api/orders`
- `GET /api/orders/my-orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`
- `PUT /api/orders/:id/cancel`
- `GET /api/menu`
- `GET /api/menu/category/:category`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`
- `GET /api/admin/stats`
- `GET /api/admin/revenue`
- `GET /api/admin/bookings/all`

## Database Schema

The backend assumes a PostgreSQL database named `gokyo_bistro` with tables:

- `users`
- `restaurant_tables`
- `bookings`
- `menu_items`
- `orders`
- `order_items`
- `reviews`
- `offers`

All protected routes require a valid JWT token in `Authorization: Bearer <token>`.
