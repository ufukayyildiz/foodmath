# Q&A Platform - Cloudflare Workers Edition

## Overview
A fast, minimal, and modern question & answer platform built specifically for Cloudflare Workers with D1 database. The platform features a clean dark theme UI, **direct question posting (no categories)**, user authentication, role-based access control, and runs on Cloudflare's edge network for optimal performance. It includes a **comprehensive bilingual translation system (250+ UI strings)** for English and Turkish with NO hardcoded text in the frontend, dynamic site settings, robust voting/reputation system, and **paginated question listings (6 per page)**. The project aims to provide a fully localized Q&A experience with a focus on performance and scalability.

## Recent Changes (November 11, 2025)
- **CRITICAL FIX**: Database schema migration - ALL tables now have PRIMARY KEY AUTOINCREMENT
  - Fixed users, questions, answers, votes tables (were missing primary keys)
  - sqlite_sequence table now exists and tracks auto-increment counters
  - Removed 2 broken questions with NULL ids during migration
  - Database backup created before migration: backup-foodmath-20251111-184340.sql
- **UPDATED**: Project renamed from "qa" to "foodmath"
  - Database: foodmath (ID: 3f5d6426-1f86-4f4f-94bd-5a8de12b0af9)
  - Domain: foodmath.net
  - All hardcoded URLs updated from mevzugida.com to foodmath.net
  - Updated package.json, README.md, and all configuration files
- **FIXED**: Cloudflare Wrangler authentication - Now uses API token instead of browser OAuth
  - Added CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID as environment secrets
  - Development server runs successfully without browser login
- **REMOVED**: All hardcoded Turkish text from code - Now 100% database-driven translations
  - Removed hardcoded fallbacks for "Tüm Sorular", "Cevaplar", "Soru Sor" buttons
  - Added missing translation keys: home.all_questions, button.ask_question
  - All UI text now pulls exclusively from translations table
  - NO hardcoded text anywhere in the application
- **FIXED**: Votes table user_id column type - Changed from TEXT to INTEGER to match users table, eliminating "1.0" display issue
  - Migrated existing votes data, keeping latest vote for duplicate entries
  - Added UNIQUE constraint on (user_id, item_type, item_id)
- **UPDATED**: Question title color - H1 titles on question detail pages now use blue (#0969da) matching homepage question titles
- **OPTIMIZED**: Mobile answer header - Answer count and first answer metadata now display on ONE line
  - Format: "1 Cevap soran @admin • 09.11.2025" all on single line
  - New `.answers-header` wrapper combines h2 count + `.answer-meta-inline` 
  - First answer's individual metadata hidden on mobile to prevent duplication
  - Flex-row layout with nowrap, 8px gap, 11px font-size on mobile
- **OPTIMIZED**: Mobile UI sizing - Vote buttons and titles are 30% smaller on mobile devices (<768px)
  - Vote buttons: 28px (was 40px), font-size: 13px (was 18px)
  - H1 titles: 17px (was 24px), H2 headings: 15px (was 20px)
  - Content text: 13px (was 14-15px) - smaller than titles for better hierarchy
  - Answer/question padding-left: 5px (was 34px) - minimal left spacing
  - Answer metadata (author, date) stays on single line with reduced font-size: 11px
  - Breadcrumb limited to single line with ellipsis overflow on mobile
- **ADDED**: Mobile hamburger menu - Collapsible slide-in menu from right side for mobile devices (<768px)
  - Hamburger button (3 lines) appears in top-right corner on mobile
  - Login and register buttons moved into mobile menu
  - Smooth slide animation with dark overlay background
  - Close button (✕) inside menu for easy dismissal
  - Menu auto-closes when clicking login/register buttons
- **FIXED**: SEO heading structure - Question title is now H1 on question pages (was H2), site title changed from H1 to styled div
- **ADDED**: Google QAPage structured data (JSON-LD) for all question pages - enables rich snippets in search results
  - Implements complete schema.org QAPage format with Question, acceptedAnswer, and suggestedAnswer
  - Includes author information, vote counts, publish dates (ISO 8601 with timezone), and answer URLs
  - Highest voted answer marked as acceptedAnswer, others as suggestedAnswer
  - All answers have unique URL anchors (#a-28 format) for direct linking
  - Consistent ID naming: questions use "question-*", answers use "a-*" format
- **ADDED**: SEO sitemap files - `/sitemap.xml` (static pages), `/q-sitemap.xml` (dynamic questions), `/robots.txt`
- **ADDED**: Automatic sitemap regeneration on every deployment with real-time question updates

## Previous Changes (November 9, 2025)
- **FIXED**: User registration bug - SQLITE_MISMATCH error resolved by using database AUTOINCREMENT instead of UUID for user IDs
- **FIXED**: Color contrast issues throughout app - all colors now meet WCAG AA accessibility standards
  - Primary buttons: #2da44e → #218838 (darker green for better contrast with white text)
  - Gray text: #656d76 → #57606a (darker for better readability)
  - Content text: Now uses #24292f (near-black) for maximum readability
  - Error messages: #ff8182 → #d1242f (darker red)
  - Success messages: #26a148 → #218838 (darker green)
- **OPTIMIZED**: LCP performance - added preload hints and defer attribute to JavaScript
- **UPDATED**: Wrangler from 3.114.15 to 4.46.0 (latest version)
- **ADDED**: Clickable usernames on homepage (matching detail page behavior)
- **ADDED**: Paragraph support for questions and answers - double Enter creates new paragraphs, single Enter creates line breaks
- **ADDED**: Visual distinction between questions and answers - light yellow background (#fffef0) for questions, light green background (#f0fff4) for answers
- **ADDED**: Left padding (10px extra) for answers to visually separate them from questions
- **FIXED**: Vote buttons now work correctly on homepage - removed inline onclick handlers and implemented proper JavaScript event delegation to prevent navigation conflicts
- **ADDED**: Vote count IDs to homepage question cards (id="question-{id}-votes") for real-time UI updates
- **ADDED**: Proper event delegation for question card clicks - now checks for button/link clicks before navigating

## Previous Changes (November 8, 2025)
- **CRITICAL**: ZERO LOCAL DATABASE - Development and production ONLY use remote Cloudflare D1 database
- **CRITICAL**: ZERO MIGRATION FILES - All database changes made directly on remote database via Cloudflare D1 API
- **REMOVED**: Category system - questions are now posted directly without requiring a category
- **REMOVED**: All migration files and local database support
- **ADDED**: Pagination support - homepage shows 6 questions per page with /p/1, /p/2 routes
- **ADDED**: Red X close button to "Ask Question" modal dialog (top-right corner)
- **ADDED**: SSR answer form placeholder system - answer forms now render correctly on question pages
- **UPDATED**: User IDs are now INTEGER format (1, 2, 3...) instead of TEXT (admin-001)
- **UPDATED**: API endpoint `/api/questions` with pagination support (GET with ?page=N parameter)
- **UPDATED**: Question creation now uses `/api/questions` POST endpoint (no category_id required)
- **UPDATED**: SSR renderHomePage now displays paginated questions instead of category cards
- **UPDATED**: Responsive layout - header is full width (100%), content is 70% on large screens (>1280px), 90% on small screens (<1280px), 95% on mobile (<768px)
- **UPDATED**: Answer textarea is now wider - 12 rows (was 8) with 200px minimum height
- **UPDATED**: All hardcoded English text replaced with Turkish fallbacks (Tüm Sorular, Soru Sor, etc.)
- **CLEANED**: Removed all category-related backend handlers and admin panel UI
- **CLEANED**: Removed migrations/ folder and all SQL files

## User Preferences
None specified yet.

## System Architecture

### Stack
- **Runtime**: Cloudflare Workers (serverless edge computing)
- **Database**: Cloudflare D1 (SQLite-based, distributed)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Wrangler CLI
- **Deployment**: Cloudflare Workers

### Key Design Decisions
- **Embedded Frontend**: HTML, CSS, and JS are embedded directly within the Worker code for minimal latency and simplified deployment.
- **No Build Step**: Utilizes pure vanilla JavaScript to eliminate build complexity.
- **Edge-First**: Optimized for Cloudflare's edge network to ensure global performance.
- **Remote-Only Database**: ZERO local database - Uses ONLY remote Cloudflare D1 database with API token authentication. All database changes made directly on remote via Cloudflare D1 API.
- **No Migration Files**: ZERO migration files - Database schema managed directly on remote D1 database using Cloudflare API.
- **Responsive Layout**: Full-width header (100%), content centered at 70% width for large screens (>1280px), 90% for medium screens (<1280px), and 95% for mobile (<768px). Optimized for 15-inch and larger displays.
- **UI/UX**: Features a light GitHub-style theme (#e3f2fd background, white cards), zero border-radius (sharp corners), modal dialogs with red X close buttons, and dynamically updated content.
- **Internationalization**: **COMPLETE translation system with 250+ UI strings** - ALL frontend text uses t() helper function with Turkish fallbacks. Admin-selectable English/Turkish languages with instant site-wide switching.
- **Authentication & Authorization**: Implements secure user registration, login, logout, password management, and role-based access control (admin/user) with PBKDF2 hashing and secure HttpOnly cookies. User IDs are INTEGER format (1, 2, 3...).
- **Content Management**: Supports user-generated questions and answers posted directly (no categories needed).
- **Voting System**: Includes upvote/downvote functionality with permanently colored vote buttons (green upvote, red downvote) for questions and answers with quality badges and vote tracking.
- **Clean URLs**: Utilizes History API for clean, human-readable URLs for questions (/q/:id), user profiles (/u/:username), and pagination (/p/:page).
- **Dynamic Site Settings**: Site title and tagline are dynamically loaded from the database and configurable via an admin panel.
- **Server-Side Rendering (SSR)**: Initial page loads use SSR for SEO optimization with client-side hydration for dynamic features like answer forms.
- **Cascade Deletion**: Proper foreign key cascade deletion logic is implemented for questions and answers.
- **Pagination**: Questions are paginated with 6 items per page, accessible via /, /p/1, /p/2, etc.

### Project Structure
```
.
├── src/
│   └── index.js          # Worker code with API routes and embedded frontend
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json          # Dependencies and scripts (dev, deploy)
├── replit.md             # Project documentation and preferences
└── README.md             # Setup and deployment instructions
```

### Database Schema
- **questions**: `id` (INTEGER), `title`, `content`, `user_id` (INTEGER), `votes`, `created_at` (NO category_id)
- **answers**: `id` (INTEGER), `question_id` (INTEGER), `content`, `user_id` (INTEGER), `votes`, `created_at`
- **users**: `id` (INTEGER AUTOINCREMENT), `email`, `username`, `password_hash`, `role`, `created_at`
- **sessions**: `session_id` (TEXT), `user_id` (INTEGER), `expires_at`, `created_at`
- **votes**: `id` (INTEGER), `user_id` (INTEGER NOT NULL), `item_type`, `item_id`, `vote`, `created_at`, UNIQUE(user_id, item_type, item_id)
- **site_settings**: `key` (TEXT), `value`, `updated_at`
- **translations**: `key` (TEXT), `lang` (TEXT), `value`

## API Endpoints

### Public Endpoints
- `GET /api/questions?page=N` - Get paginated questions (6 per page)
- `POST /api/questions` - Create new question (auth required, no category_id)
- `GET /api/q/:id` - Get question with answers
- `POST /api/q/:id/answer` - Post answer to question
- `GET /api/u/:username` - Get user profile
- `GET /api/settings` - Get public site settings
- `GET /api/translations` - Get all translations

### Auth Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Admin Endpoints (Admin role required)
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/ban` - Ban/unban user
- `GET /api/admin/content/questions` - List all questions
- `PUT /api/admin/content/questions/:id` - Update question
- `DELETE /api/admin/content/questions/:id` - Delete question
- `GET /api/admin/content/answers` - List all answers
- `PUT /api/admin/content/answers/:id` - Update answer
- `DELETE /api/admin/content/answers/:id` - Delete answer

## External Dependencies
- **Cloudflare Workers**: Serverless execution environment.
- **Cloudflare D1**: Distributed SQLite database.
- **Wrangler CLI**: Command-line tool for Cloudflare Workers development and deployment.
