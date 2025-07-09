# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marketplace Watcher is a full-stack web application that monitors Facebook Marketplace listings and alerts users when items matching their criteria become available. Built as a monorepo using pnpm workspaces.

## Feature Implementation System Guidelines

### Feature Implementation Priority Rules
- IMMEDIATE EXECUTION: Launch parallel Tasks immediately upon feature requests
- NO CLARIFICATION: Skip asking what type of implementation unless absolutely critical
- PARALLEL BY DEFAULT: Always use 7-parallel-Task method for efficiency

### Parallel Feature Implementation Workflow
1. **Component**: Create main component file
2. **Styles**: Add subcomponents and styles
3. **Tests**: Create test files  
4. **Types**: Create type definitions
5. **Hooks**: Create custom hooks/utilities
6. **Integration**: Update routing, imports, exports
7. **Remaining**: Update package.json, documentation, configuration files
8. **Review and Validation**: Coordinate integration, run tests, verify build, check for conflicts

### Context Optimization Rules
- Strip out all comments when reading code files for analysis
- Each task handles ONLY specified files or file types
- Task 7 combines small config/doc updates to prevent over-splitting

### Feature Implementation Guidelines
- **CRITICAL**: Make MINIMAL CHANGES to existing patterns and structures
- **CRITICAL**: Preserve existing naming conventions and file organization
- Follow project's established architecture and component patterns
- Use existing utility functions and avoid duplicating functionality

## Commands

### Development
```bash
pnpm dev              # Start Next.js development server with Turbopack
pnpm build            # Build all packages
pnpm format-lint  # Format and lint all code with Biome
```

### Database
```bash
pnpm --filter @marketplace-watcher/db db:generate  # Generate migrations
pnpm --filter @marketplace-watcher/db db:push      # Push schema changes to DB
pnpm --filter @marketplace-watcher/db db:studio    # Open Drizzle Studio GUI
```

### Monorepo
```bash
turbo build  # Build all packages in dependency order
turbo lint   # Lint all packages
```

## Architecture

### Monorepo Structure
- `apps/web/` - Next.js application with App Router
- `packages/db/` - Database layer using Drizzle ORM + PostgreSQL
- `packages/ui/` - Shared UI components (Radix + Tailwind)
- `packages/types/` - Shared TypeScript types
- `packages/supabase/` - Supabase configuration and migrations

### Tech Stack
- **Frontend**: Next.js (App Router), React 19, Tailwind CSS v4
- **Backend**: oRPC for type-safe APIs, Next.js API routes
- **Database**: PostgreSQL via Supabase, Drizzle ORM
- **Auth**: Supabase Auth (email/password)
- **Build**: Turbo monorepo, pnpm workspaces
- **Code Quality**: Biome for formatting/linting

### Database Schema
Core entities follow marketplace monitoring workflow:
- `users` - Supabase Auth integration
- `monitors` - User-created search criteria (query, location, price range)
- `listings` - Facebook Marketplace items with unique FB IDs
- `monitor_matches` - Junction table linking monitors to matching listings
- `listing_price_history` - Tracks price changes over time

### API Architecture
Uses oRPC instead of REST for full type safety:
- Single endpoint: `/app/rpc/[[...rest]]/route.ts`
- Routers organized by domain: monitors, matches, marketplace, notifications
- All operations are user-scoped for security
- Zod validation for all inputs

### Key Features
- Monitor creation with search criteria, location, price range
- Automated Facebook Marketplace scraping (planned)
- Email notifications for new matches
- Photo-based monitoring capabilities
- Price tracking and history

## Development Notes

### Typescript Style
- Always use arrow functions
- Type everything, don't use interfaces
- Never type things as any

### React Style

### Database Development
- Use Drizzle migrations for schema changes
- Database types are auto-generated from schema
- All data operations must be user-scoped via `user_id` foreign keys

### API Development
- All new API endpoints should use oRPC routers in `/src/helpers/orpc/`
- Follow existing pattern of input validation with Zod
- Return proper error responses with HTTP status codes

### Frontend Development
- Components should use shared UI library from `@marketplace-watcher/ui`
- Follow existing patterns for authentication and protected routes
- Use next-themes for dark/light mode support

### Authentication
- All protected routes require Supabase session validation
- User data is scoped by UUID from Supabase Auth
- Row Level Security is implemented at database level

## Important Files

### Configuration
- `/turbo.json` - Monorepo build configuration
- `/biome.json` - Code formatting and linting rules
- `/packages/db/drizzle.config.ts` - Database configuration

### Database
- `/packages/db/src/schema.ts` - Complete database schema definition
- `/packages/supabase/migrations/` - SQL migration files

### API Layer
- `/apps/web/src/helpers/orpc/` - All RPC router definitions
- `/apps/web/src/lib/orpc.server.ts` - Server-side RPC client setup

