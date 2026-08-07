# Supabase Setup Guide

This project relies on Supabase exclusively as a robust, scalable PostgreSQL provider. While the ORM (Drizzle) controls the persistence layer entirely, Supabase is the underlying engine that makes it run.

## 1. Create Project
1. Go to [Supabase](https://supabase.com).
2. Click **New Project** and select your organization.
3. Choose a strong database password and select a region closest to your Vercel deployment (e.g., US East).
4. Click **Create new project**.

## 2. Obtain Connection Strings
1. In your Supabase Dashboard, go to **Project Settings** > **Database**.
2. Scroll down to **Connection String** > **URI**.
3. **IMPORTANT FOR VERCEL**: Switch the connection mode to **Transaction** (port 6543) instead of **Session** (port 5432). This uses PgBouncer, which prevents Vercel serverless functions from exhausting database connections.
4. Replace `[YOUR-PASSWORD]` with the password you created.

This string becomes your `DATABASE_URL` environment variable.

## 3. Obtain Application Keys
If you plan to use Supabase Storage or Supabase Auth in the future, fetch your API keys:
1. Go to **Project Settings** > **API**.
2. Note your **Project URL**, **anon public key**, and **service_role secret**.

## 4. Initial Database Setup
From your local machine (where you have this code downloaded):
1. Create a `.env.local` file and paste the `DATABASE_URL`.
2. Run `npm run db:migrate` to construct the tables in Supabase.
3. Run `npm run db:seed` to insert initial plan and niche data.
4. Run `npm run admin:create` to generate your secure admin login.

*Your database is now ready to receive connections from Vercel.*
