# Haat: full stack e-commerce (React + Node/Express + PostgreSQL)

## Backend (folder: server)
```powershell
cd server
npm install
Copy-Item .env.example .env      # then open .env and paste your Neon DATABASE_URL + a JWT_SECRET
npm run db:init                  # creates tables (safe to run again)
npm run seed                     # sample products + admin user (resets products and orders)
npm run dev                      # http://localhost:5000
```
Admin login: admin@haat.dev / Admin@12345

## Frontend (folder: client)
```powershell
cd client
npm install
Copy-Item .env.example .env
npm run dev                      # http://localhost:5173
```

## API
POST /api/auth/register, /login | GET /api/auth/me
GET /api/products (search, category, minPrice, maxPrice, inStock, sort, page, limit)
GET /api/products/categories | GET /api/products/:id
POST, PUT, DELETE /api/products and PATCH /api/products/:id/stock (admin only)
POST /api/orders | GET /api/orders (logged in)
