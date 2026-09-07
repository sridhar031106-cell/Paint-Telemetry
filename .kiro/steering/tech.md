---
inclusion: always
---

# Technology Stack & Build System

## Framework & Core Technologies
- **Frontend Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.6.3
- **Styling**: Tailwind CSS 3.4.17 with shadcn/ui components
- **Database**: SQLite with better-sqlite3
- **Validation**: Zod for runtime type validation
- **Charting**: Recharts for data visualization

## UI Components & Styling
- **Component Library**: shadcn/ui (New York style)
- **Icons**: Lucide React
- **Themes**: next-themes for dark/light mode
- **Utility Classes**: Tailwind Merge & clsx for conditional classes
- **Animation**: tailwindcss-animate for component animations

## Development Dependencies
- **Testing**: Vitest 2.1.4 with fast-check for property testing
- **Linting**: ESLint 9.0.0 with Next.js config
- **Build Tools**: TypeScript, PostCSS, Autoprefixer

## Common Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
```

### Quality & Testing
```bash
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
```

### Simulation
```bash
node scripts/sensor-simulation.js  # Run hardware simulation script
```

## Project Configuration
- **TypeScript**: Uses path alias `@/*` pointing to `./src/*`
- **Next.js**: App Router architecture with API routes
- **Tailwind**: Dark mode support with CSS custom properties
- **ESLint**: Disables `@typescript-eslint/no-explicit-any`, warns on unused vars

## Database
- **Location**: `/data/paintshop.db`
- **Library**: better-sqlite3 for synchronous SQLite access
- **Schema**: Defined in `src/lib/db.ts`

## API Patterns
- All API routes use Zod validation for input sanitization
- Error handling follows consistent JSON response format
- Routes located in `src/app/api/` with Next.js App Router