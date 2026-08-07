# GitHub Best Practices for Instahub

Since this codebase interacts directly with Vercel for CI/CD, managing your GitHub repository cleanly is critical for production safety.

## 1. Initial Push
```bash
git init
git add .
git commit -m "Initial commit for Vercel deployment"
git branch -M main
git remote add origin https://github.com/your-username/instahub.git
git push -u origin main
```

## 2. Secrets Management (CRITICAL)
**NEVER** commit `.env`, `.env.local`, or `.env.production` to your repository. 
If you accidentally push a `.env` file containing your `DATABASE_URL` or `PEAKERR_API_KEY`:
1. Change the compromised passwords/keys immediately at the provider (Supabase, Peakerr).
2. Delete the file from Git (`git rm --cached .env`).
3. Only `.env.example` should exist in the repository to serve as a template.

## 3. Working Flow
When making changes locally:
1. `git checkout -b feature/new-button`
2. Test changes locally (`npm run dev`)
3. Check for typescript errors (`npm run typecheck`)
4. Commit and push
5. Create a Pull Request (PR) on GitHub
6. Vercel will automatically generate a Preview deployment for you to test.
7. Merge into `main` to trigger the Production deployment on Vercel.
