# Production Readiness Checklist

[ ] `NODE_ENV=production` is set
[ ] `DATABASE_URL` points to a robust, production-ready PostgreSQL instance
[ ] All database migrations applied (`npm run db:migrate`)
[ ] Database backup plan/strategy reviewed and implemented
[ ] Strong, random `SESSION_SECRET` generated and set in environment variables
[ ] Initial admin account created with a secure password
[ ] CenterPag webhook URL configured in CenterPag dashboard
[ ] CenterPag webhook idempotency tested
[ ] Peakerr provider mappings configured in the Admin Dashboard
[ ] HikerAPI key configured and tested
[ ] Resend domain verified for outgoing emails
[ ] Rate limiting configured in `middleware.ts` (if applicable for your hosting)
[ ] `npm run build` completes without errors
[ ] Custom domain points correctly to the server
[ ] HTTPS is active and enforced
[ ] End-to-end payment and fulfillment flow tested in production environment
