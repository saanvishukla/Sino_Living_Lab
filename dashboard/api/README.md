# Dashboard API

Backend API server for SmartDirectory dashboard.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### Tenants
- `GET /api/tenants` - Get all tenants (supports ?building=A, ?floor=5, ?unit=5B)
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Buildings
- `GET /api/buildings` - Get all buildings
- `GET /api/buildings/:building/tenants` - Get all tenants in a building

### Health
- `GET /health` - API health check
