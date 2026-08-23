# Convenience Store

A full-stack inventory management system for a convenience store. It lets you track
products, adjust stock levels, and review the full history of stock movements.

## Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Backend  | ASP.NET Core Web API (.NET 9)                     |
| Database | SQLite via Entity Framework Core                  |
| Frontend | React 19, TypeScript, Vite                        |
| Linting  | oxlint                                            |

## Project Structure

```
ConvenienceStore/
├── ConvenienceStore.slnx         # Solution file
├── backend/
│   └── ConvenienceStore.Api/
│       ├── Controllers/          # REST API endpoints
│       ├── Data/                 # AppDbContext (EF Core)
│       ├── DTOs/                 # Request/response contracts
│       ├── Models/               # Product & StockMovement entities
│       └── Migrations/           # EF Core migrations
└── frontend/
    └── src/
        ├── components/           # Modals (product form, stock adjust, movements)
        ├── api.ts                # API client
        ├── types.ts              # Shared TypeScript types
        ├── format.ts             # Currency/date/label formatting
        └── App.tsx               # Main UI (Products & Stock Movements tabs)
```

## Features

### Products
- List products (active only by default)
- Live search by name
- Create, edit, and soft-delete products
- Track price, description, and current stock quantity

### Stock
- Adjust stock with three movement types: `In`, `Out`, and `Adjustment`
- Prevents negative stock levels
- Records every change as a `StockMovement` with quantity change, resulting
  stock, and optional reason

### History
- Global stock movement history (most recent first)
- Per-product movement history
- Initial stock is recorded automatically when a product is created

## API Endpoints

### Products

| Method   | Endpoint                       | Description                                  |
| -------- | ------------------------------ | -------------------------------------------- |
| `GET`    | `/api/products`                | List products (`?search=` filter, `?includeInactive=true`) |
| `GET`    | `/api/products/{id}`           | Get a single product                         |
| `POST`   | `/api/products`                | Create a product (records initial stock)     |
| `PUT`    | `/api/products/{id}`           | Update a product                             |
| `DELETE` | `/api/products/{id}`           | Soft-delete a product                        |
| `POST`   | `/api/products/{id}/adjust-stock` | Adjust stock (In / Out / Adjustment)      |
| `GET`    | `/api/products/{id}/movements` | List movements for a product                 |

### Stock Movements

| Method | Endpoint               | Description                                    |
| ------ | ---------------------- | ---------------------------------------------- |
| `GET`  | `/api/stock-movements` | List movements (`?productId=`, `?limit=`)      |

## Data Model

- **Product**: `Id`, `Name`, `Description`, `Price`, `StockQuantity`, `IsActive`,
  `CreatedAt`, `UpdatedAt`
- **StockMovement**: `Id`, `ProductId`, `Type` (`In`, `Out`, `Adjustment`),
  `QuantityChange`, `StockAfter`, `Reason`, `CreatedAt`

## Getting Started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (18+)

### 1. Backend

```bash
cd backend/ConvenienceStore.Api
dotnet run
```

The API starts at `http://localhost:5200`. Database migrations are applied
automatically on startup (`conveniencestore.db`). The OpenAPI document is
available at `/openapi` in development.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` requests to the
backend at `http://localhost:5200`.

## Available Scripts (frontend)

| Script           | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Start the Vite dev server         |
| `npm run build`  | Type-check and build for production |
| `npm run lint`   | Run oxlint                        |
| `npm run preview`| Preview the production build      |
