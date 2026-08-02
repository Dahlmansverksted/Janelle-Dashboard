$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "Dahlman Dashboard - Cloudflare setup" -ForegroundColor Red
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is missing. Install the current Node.js LTS version, then run this file again." -ForegroundColor Yellow
  exit 1
}

Write-Host "1/4 Installing Wrangler..."
npm install

Write-Host ""
Write-Host "2/4 Signing in to Cloudflare..."
npx wrangler login

Write-Host ""
Write-Host "3/4 Creating the D1 database..."
Write-Host "Cloudflare will print a database_id. Copy it into wrangler.jsonc in place of PASTE_YOUR_D1_DATABASE_ID_HERE." -ForegroundColor Yellow
Write-Host ""
npx wrangler d1 create dahlman-dashboard-db --location weur

Write-Host ""
Write-Host "4/4 After inserting the database_id, run:" -ForegroundColor Green
Write-Host "  npm run db:migrate:remote"
Write-Host ""
Write-Host "Then connect this GitHub repository to Cloudflare Pages."
Write-Host "The complete instructions are in START_HER.md."
