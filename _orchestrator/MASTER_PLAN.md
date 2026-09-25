# Inventory & Order Management System — Master Plan

## Agent Assignments

| Agent | Responsibility | Status |
|-------|---------------|--------|
| W1 DB-SCHEMA | PostgreSQL models, schemas, migrations, seed data | pending |
| W2 BACKEND-CORE | FastAPI routes, business logic, Dockerfile | pending |
| W3 FRONTEND-UI | React app, all pages, Tailwind, Dockerfile | pending |
| W4 DEVOPS | docker-compose, .env files, nginx, README, Makefile | pending |

## Key Constraints
- No hardcoded credentials — env vars only
- PostgreSQL only, async (asyncpg)
- Pydantic v2
- UUID primary keys
- Proper HTTP status codes (201, 204, 409, etc.)
- Tailwind only (no MUI, Bootstrap, custom CSS)
- React functional components
