# MADE WITH [REPLIT](https://replit.com/refer/devtr)


# FoodMath - Food Science Q&A Platform

A fast, minimal, and modern question & answer platform built on Cloudflare Workers with D1 database, focused on food science and mathematics.

## Features

- 🚀 **Fast**: Runs on Cloudflare's edge network
- 💾 **D1 Database**: SQLite-based database at the edge
- 🎨 **Modern UI**: Clean, minimal design with responsive layout
- 📱 **Mobile Optimized**: Works perfectly on all devices
- 🌍 **Bilingual**: Full Turkish and English support (250+ UI strings)
- 🔐 **Secure Auth**: User registration, login, and role-based access
- ⬆️⬇️ **Voting System**: Upvote/downvote questions and answers
- 🔍 **SEO Optimized**: Structured data, sitemaps, and meta tags

## Setup Instructions

### Prerequisites

1. A Cloudflare account (free tier works)
2. Node.js installed (v18 or later)
3. Cloudflare API Token and Account ID

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Environment Secrets

Add your Cloudflare credentials to Replit Secrets:

- `CLOUDFLARE_API_TOKEN` - Your API token from Cloudflare Dashboard
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Step 3: Verify Database Configuration

The database is already configured in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "xxxxxxxxxxxxx"
database_id = "xxxxxxx"
```

### Step 4: Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Step 5: Deploy

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

Your app will be live at `https://foodmath.net`

## Project Structure

```
.
├── src/
│   └── index.js          # Cloudflare Worker with embedded frontend
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json          # Dependencies
└── README.md             # This file
```

## Database Schema

### Users
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `email`: TEXT UNIQUE
- `username`: TEXT UNIQUE
- `password_hash`: TEXT (PBKDF2)
- `role`: TEXT (admin/user)
- `created_at`: DATETIME

### Questions
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `title`: TEXT
- `content`: TEXT
- `user_id`: INTEGER (FK to users)
- `votes`: INTEGER
- `created_at`: DATETIME

### Answers
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `question_id`: INTEGER (FK to questions, CASCADE)
- `content`: TEXT
- `user_id`: INTEGER (FK to users)
- `votes`: INTEGER
- `created_at`: DATETIME

### Votes
- `id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `user_id`: INTEGER (FK to users)
- `item_type`: TEXT (question/answer)
- `item_id`: INTEGER
- `vote`: INTEGER (1 or -1)
- UNIQUE(user_id, item_type, item_id)

## API Endpoints

### Public
- `GET /api/questions?page=N` - Get paginated questions
- `GET /api/q/:id` - Get question with answers
- `POST /api/q/:id/answer` - Post answer
- `GET /api/u/:username` - Get user profile
- `GET /api/settings` - Get site settings
- `GET /api/translations` - Get UI translations

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Admin (requires admin role)
- `GET /api/admin/settings` - Manage site settings
- `GET /api/admin/users` - User management
- `GET /api/admin/content/questions` - Content moderation
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/questions/:id` - Delete question

## Database Management

Execute SQL queries on remote database:

```bash
wrangler d1 execute foodmath --remote --command "SELECT * FROM questions LIMIT 5;"
```

Check database tables:

```bash
wrangler d1 execute foodmath --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

## Domain Configuration

The app is configured for `foodmath.net` in `wrangler.toml`:

```toml
[[routes]]
pattern = "foodmath.net"
custom_domain = true
```

## License

MIT
