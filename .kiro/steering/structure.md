---
inclusion: always
---

# Project Organization & Structure

## Directory Structure

```
/
├── src/                    # Application source code
│   ├── app/               # Next.js App Router pages and API routes
│   │   ├── api/          # Backend API endpoints
│   │   │   ├── alerts/   # Alert management routes
│   │   │   ├── audit/    # Audit logging routes
│   │   │   ├── auth/     # Authentication routes
│   │   │   ├── config/   # Configuration routes
│   │   │   ├── defects/  # Defect tracking routes
│   │   │   ├── export/   # Data export routes (CSV, PDF)
│   │   │   ├── sensors/  # Sensor management routes
│   │   │   └── telemetry/# Telemetry data routes
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   └── globals.css   # Global styles
│   ├── components/        # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── *.tsx        # Domain-specific components
│   └── lib/              # Shared utilities and services
│       ├── services/     # Business logic services
│       ├── utils/        # Utility functions
│       └── types.ts      # TypeScript type definitions
├── data/                  # SQLite database files
├── scripts/              # Node.js utility scripts
├── tests/                # Test files
└── public/               # Static assets
```

## Architecture Patterns

### API Routes
- **Location**: `src/app/api/[resource]/route.ts`
- **Validation**: All POST/PUT endpoints must use Zod schemas
- **Error Handling**: Consistent JSON response format with status codes
- **Database Access**: Services should be called from API routes, not direct DB access

### Components Organization
- **UI Components**: `src/components/ui/` - Reusable shadcn/ui components
- **Domain Components**: `src/components/` - Feature-specific components
- **Naming**: Use PascalCase for component files and exports
- **Client/Server**: Mark client components with `'use client'` directive

### Services Layer
- **Location**: `src/lib/services/`
- **Responsibility**: Contains business logic and database operations
- **Separation**: Each service handles a specific domain (telemetry, alerts, sensors)
- **Testing**: Services should have corresponding test files

### Type Definitions
- **Location**: `src/lib/types.ts`
- **Pattern**: Use TypeScript interfaces and types for database models
- **Sharing**: Types should be imported across components and services

## File Naming Conventions
- **TypeScript**: `.ts` for utilities, `.tsx` for React components
- **Components**: PascalCase (e.g., `SensorGrid.tsx`)
- **Utilities**: camelCase (e.g., `cqiCalculator.ts`)
- **Services**: camelCase with `Service` suffix (e.g., `alertService.ts`)

## Import Paths
- **Absolute Imports**: Use `@/*` alias (e.g., `@/components/SensorGrid`)
- **Relative Imports**: Use for sibling files within same directory
- **Parent Imports**: Use `../` for parent directory navigation

## Database Structure
- **Primary Database**: `data/paintshop.db`
- **WAL Mode**: Uses SQLite Write-Ahead Logging for better concurrency
- **Initialization**: Database schema defined in `src/lib/db.ts`
- **Backup Files**: `.db-shm` and `.db-wal` are SQLite WAL files, don't delete

## Testing Structure
- **Location**: `tests/` directory at root
- **Naming**: `*.test.ts` for test files
- **Framework**: Vitest with fast-check for property testing
- **Coverage**: Focus on business logic in services layer