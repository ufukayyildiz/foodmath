# FoodMath Database Information

## Current Database Configuration

The database is already configured and working:

```toml
[[d1_databases]]
binding = "DB"
database_name = "foodmath"
database_id = "3f5d6426-1f86-4f4f-94bd-5a8de12b0af9"
```

## Authentication Setup

This project uses API token authentication (not browser OAuth). Make sure you have these secrets configured in Replit:

- `CLOUDFLARE_API_TOKEN` - Your API token from Cloudflare Dashboard
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

## Database Commands

List all your D1 databases:
```bash
wrangler d1 list
```

Check database tables:
```bash
wrangler d1 execute foodmath --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Query the database:
```bash
wrangler d1 execute foodmath --remote --command "SELECT * FROM questions LIMIT 5;"
```

Check auto-increment counters:
```bash
wrangler d1 execute foodmath --remote --command "SELECT * FROM sqlite_sequence;"
```

## Database Backup

A backup was created on November 11, 2025:
- File: `backup-foodmath-20251111-184340.sql`

To create a new backup:
```bash
wrangler d1 export foodmath --remote --output backup-foodmath-$(date +%Y%m%d-%H%M%S).sql
```

## Database Schema Status

✅ All tables have PRIMARY KEY AUTOINCREMENT:
- users (seq: 4)
- questions (seq: 20)
- answers (seq: 31)
- votes (seq: 13)

✅ Foreign keys properly configured with CASCADE/SET NULL
✅ Unique constraints on votes table
✅ sqlite_sequence table exists and tracks counters
