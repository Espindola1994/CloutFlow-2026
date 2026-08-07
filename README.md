# Instahub (Supabase & Vercel Edition)

Instahub is a premium social media growth platform built with Next.js App Router. This repository is pre-configured to be deployed securely on Vercel using Supabase (PostgreSQL) as its primary database.

## Architecture

* **Frontend & Backend**: Next.js 15+ (App Router)
* **Database**: PostgreSQL (via Supabase)
* **ORM**: Drizzle ORM
* **UI**: Tailwind CSS + shadcn/ui
* **Auth**: Custom HTTP-Only Secure Server Sessions (Argon2)
* **Hosting**: Vercel

## Deployment Flow

1. Create a [Supabase](https://supabase.com) Project.
2. Link this GitHub Repository to [Vercel](https://vercel.com).
3. Populate Vercel with all necessary Environment Variables (see `.env.example`).
4. Apply the Database Migrations.
5. You're ready to process orders!

## How to Apply Database Migrations
Once your project is linked to Vercel and your Supabase PostgreSQL `DATABASE_URL` is available, run locally from your machine:
```bash
npm install
npm run db:migrate
```
This will create all the necessary schema tables inside your Supabase project.

## How to Create the Admin User
To securely generate the first login for the Dashboard, connect to your Supabase PostgreSQL connection string on your local machine and run:
```bash
npm run admin:create
```
Follow the interactive prompt to set your admin email and password.

## Documentation
Please check the `/docs` directory for detailed setup instructions:
- `docs/SUPABASE_SETUP.md`
- `docs/VERCEL_SETUP.md`
- `docs/GITHUB_SETUP.md`
- `docs/PRODUCTION_CHECKLIST.md`
