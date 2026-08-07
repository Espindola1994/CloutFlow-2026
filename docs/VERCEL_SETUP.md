# Vercel Deployment Guide

Deploying this project to Vercel is seamless if connected via GitHub.

## 1. Import Git Repository
1. Log into [Vercel](https://vercel.com) and click **Add New** > **Project**.
2. Select the GitHub repository containing this code.
3. Vercel will automatically detect the **Next.js** framework. Leave the default Build and Output Settings unchanged.

## 2. Configure Environment Variables
Before clicking Deploy, expand the **Environment Variables** section. Add every variable found in your `.env.example` file. 

Crucially:
- `DATABASE_URL`: Ensure you use the Supabase Transaction Pooler connection string (port 6543) so serverless functions scale correctly.
- `SESSION_SECRET`: Generate a completely random string (e.g., a 64-character UUID or random bytes). This keeps your admin dashboard secure.
- `NEXT_PUBLIC_APP_URL`: The production URL where your Vercel app will live.

## 3. Deploy
Click **Deploy**. Vercel will run `npm install` and `npm run build`.

## 4. Custom Domain Setup
1. In your Vercel Project Dashboard, click **Settings** > **Domains**.
2. Add your custom domain (e.g., `instahub.com`).
3. Vercel will provide A and CNAME records. Add these to your domain registrar (e.g., Namecheap, Cloudflare).
4. Wait for SSL propagation to finish.

## 5. Webhooks Updates
Once your domain is active on Vercel:
1. Update your **CenterPag** Webhook URL in their dashboard to point to: `https://your-domain.com/api/webhook/centerpag`.
2. Update **Resend** or email services to verify your new production domain.
