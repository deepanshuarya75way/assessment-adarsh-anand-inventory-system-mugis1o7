# Inventory & Order Management System

A production-ready full-stack web application built for **Ethara.AI** to manage product inventory, customer records, and orders. The system provides real-time stock validation, order lifecycle management, revenue tracking, dark mode theming, and a responsive dashboard — all backed by an async PostgreSQL database and exposed through a RESTful API.

## Live Demo

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://inventory-system-orpin-eight.vercel.app |
| **Backend API (Render)** | https://inventory-system-56zd.onrender.com |
| **API Docs (Swagger)** | https://inventory-system-56zd.onrender.com/docs |
| **API Docs (ReDoc)** | https://inventory-system-56zd.onrender.com/redoc |

> The live app is pre-loaded with Ethara.AI-relevant products (GPU servers, NVMe storage, ML workstations) and customers (TII, G42, MBZUAI, Cohere, ADNOC, Mubadala).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy (async), asyncpg, Pydantic v2, PostgreSQL 16 |
| **Frontend** | React 18, Tailwind CSS, React Router v6, Axios |
| **Infrastructure** | Docker, Docker Compose, nginx (multi-stage build) |
| **Deployment** | Render (backend + PostgreSQL), Vercel (frontend), Docker Hub |

---

## Features

### Products
- Create, edit, and delete products with name, SKU, price, and quantity
- Inventory summary cards: Total / In Stock / Low Stock / Out of Stock
- Filter tabs + live search by name or SKU
- Stock status badges (In Stock / Low Stock / Out of Stock)
- Paginated table (8 per page)

### Customers
- Create, edit, and delete customers with name, email, and phone
- Avatar initials with colour-coded gradients
- Live search by name or email
- Email uniqueness validation (409 conflict on duplicate)
- Paginated table (8 per page)

### Orders
- Place orders with multi-item selection and real-time stock guard
- Stock is deducted immediately on order creation
- Order lifecycle: **Pending → Confirmed** or **Pending → Cancelled**
- Confirmed orders **cannot** be cancelled (enforced at backend)
- Stock is fully restored when a pending order is cancelled
- Paginated table (10 per page) with status filter tabs and search
- Download XLS sales report with colour-coded headers, zebra rows, and confirmed-revenue footer

### Order Detail
- Visual status pipeline (Pending → Confirmed / Cancelled)
- Full line-item breakdown with unit price, quantity, and subtotal
- Confirm / Cancel actions with confirmation dialogs

### Dashboard
- Animated count-up stat cards: Total Products, Customers, Orders, Confirmed Revenue
- Low-stock alert table (products with qty < 10)
- Recent Orders table with pagination

### UI / UX
- Dark mode toggle (persists across sessions)
- 5 accent colour themes: Indigo, Blue, Emerald, Rose, Amber
- Shimmer card animations, fade-in-up transitions
- In-app toast notifications (success / error) — no browser alerts
- Confirmation dialogs for all destructive actions
- Fully responsive layout

### Error Handling
- All Pydantic 422 validation errors are parsed and displayed inline (no crashes)
- Out-of-stock orders rejected at API level with clear error messages
- Duplicate SKU and duplicate email surfaced as readable messages
- 404 on unknown resources

---

## API Reference

### Products

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/products` | Create a product |
| `GET` | `/products` | List all products |
| `GET` | `/products/{id}` | Get a single product |
| `PUT` | `/products/{id}` | Update product details or quantity |
| `DELETE` | `/products/{id}` | Delete a product |

### Customers

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/customers` | Create a customer |
| `GET` | `/customers` | List all customers |
| `GET` | `/customers/{id}` | Get a single customer |
| `PUT` | `/customers/{id}` | Edit customer name, email, or phone |
| `DELETE` | `/customers/{id}` | Delete a customer |

### Orders

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/orders` | Place an order (validates and deducts stock) |
| `GET` | `/orders` | List all orders |
| `GET` | `/orders/{id}` | Get order detail with line items |
| `PATCH` | `/orders/{id}/confirm` | Confirm a pending order |
| `DELETE` | `/orders/{id}` | Cancel a pending order and restore stock |

---

## Business Rules (enforced at backend)

| Rule | Behaviour |
|------|-----------|
| Stock guard | Order rejected if any item exceeds available quantity |
| Stock deduction | Stock decreases immediately when an order is placed |
| Cancel = restore | Cancelling a pending order restores all product quantities |
| Confirmed lock | Confirmed orders cannot be cancelled |
| Revenue calculation | Dashboard revenue counts **confirmed orders only** |
| SKU uniqueness | Duplicate SKU returns 409 Conflict |
| Email uniqueness | Duplicate customer email returns 409 Conflict |

---


- Frontend: http://localhost:3000
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

export DATABASE_URL=postgresql+asyncpg://postgres:1234@localhost:5432/inventorydb
export CORS_ORIGINS=http://localhost:3000

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
export REACT_APP_API_URL=http://localhost:8000
npm start
```

### Seed Data

```bash
# Run against any PostgreSQL instance
psql "$DATABASE_URL" -f backend/migrations/init.sql
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `DATABASE_URL` | Full asyncpg connection string (`postgresql+asyncpg://...`) |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) |
| `REACT_APP_API_URL` | Backend URL used by the frontend |

---

## Deployment

### Database — Render PostgreSQL

1. Create a new **PostgreSQL** instance on [render.com](https://render.com).
2. Copy the **External Database URL** and replace `postgresql://` with `postgresql+asyncpg://`.
3. Run `psql "$DATABASE_URL" -f backend/migrations/init.sql` to initialise schema and seed data.

### Backend — Render Web Service

1. Create a **Web Service**, connect the GitHub repo.
2. Runtime: **Docker** — Dockerfile path: `./backend/Dockerfile`
3. Environment variables:
   - `DATABASE_URL` — asyncpg connection string
   - `CORS_ORIGINS` — Vercel frontend URL

### Frontend — Vercel

1. Import the repo on [vercel.com](https://vercel.com).
2. Root directory: `frontend`
3. Environment variable:
   - `REACT_APP_API_URL` — Render backend URL
4. Vercel rebuilds automatically on every push to `main`.

---



## Project Structure

```
inventory-system/
├── backend/
│   ├── main.py               # FastAPI app, CORS, lifespan
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic v2 request/response schemas
│   ├── database.py           # Async engine & session
│   ├── routers/
│   │   ├── products.py       # Product CRUD
│   │   ├── customers.py      # Customer CRUD + edit
│   │   └── orders.py         # Order lifecycle
│   ├── migrations/
│   │   └── init.sql          # Schema + Ethara.AI seed data
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js     # Axios instance
│   │   │   └── errors.js     # Pydantic error normaliser
│   │   ├── components/
│   │   │   ├── Badge.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   └── ThemeContext.jsx  # Dark mode + accent colours
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx / ProductForm.jsx
│   │   │   ├── Customers.jsx / CustomerForm.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── OrderDetail.jsx
│   │   │   └── CreateOrder.jsx
│   │   └── index.css         # CSS custom properties, animations
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```
