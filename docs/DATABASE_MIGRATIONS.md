# Instahub Database Migrations

Instahub uses Drizzle ORM to manage PostgreSQL schema changes.

## Commands

- `npm run db:generate` - Generates new SQL migration files in `./drizzle` based on changes to `src/db/schema/*.ts`. Run this locally when you modify the schema.
- `npm run db:migrate` - Applies the generated SQL migrations to the database specified by `DATABASE_URL`. Run this on production/Replit to update the database schema safely.
- `npm run db:studio` - Starts a local web interface to inspect and modify the database directly.

## Production Warning
Avoid using `npx drizzle-kit push` in production, as it can cause unintended data loss by attempting to force schema synchronization without safe SQL migrations. Always use `npm run db:generate` followed by `npm run db:migrate`.
