# Dahlman Dashboard — GitHub + Cloudflare + D1

The dashboard source is now stored in this repository.

## 1. Create the D1 database

Install Node.js LTS, clone/download the repository, then run:

```bash
npm install
npx wrangler login
npm run db:create
```

Copy the `database_id` printed by Cloudflare and replace `PASTE_YOUR_D1_DATABASE_ID_HERE` in `wrangler.jsonc`.

Then run:

```bash
npm run db:migrate:remote
```

Commit the updated `wrangler.jsonc`.

## 2. Create Cloudflare Pages

In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git** and select `Dahlmansverksted/Dashboard`.

Use:

- Production branch: `main`
- Framework preset: `None`
- Build command: leave empty
- Build output directory: `.`

Deploy the project.

## 3. Add bindings and secret

In the Pages project settings, confirm the D1 binding:

- Variable name: `DB`
- Database: `dahlman-dashboard-db`

Under **Variables and Secrets**, add an encrypted secret:

- Name: `DASHBOARD_TOKEN`
- Value: a private random key of at least 32 characters

Redeploy after adding the secret.

## 4. Connect the dashboard

Open the Cloudflare Pages URL, press **Connect cloud sync**, and enter the same private key. The dashboard will then synchronize notes, tasks, dates, workouts, habits, bodyweight and the snus counter through D1.

Never commit the real `DASHBOARD_TOKEN`, passwords, or two-factor authentication codes.
