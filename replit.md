# Q&A Platform - Cloudflare Workers Edition

## Overview
This project is a fast, minimal, and modern question & answer platform built for Cloudflare Workers and D1 database, named "foodmath". Its core purpose is to provide a highly performant and scalable Q&A experience with a clean GitHub-style UI. Key capabilities include direct question posting (no categories), robust user authentication and role-based access control, a comprehensive bilingual translation system for English and Turkish (250+ UI strings, no hardcoded text), dynamic site settings, a voting/reputation system, and paginated question listings (6 per page). The platform leverages Cloudflare's edge network for optimal global performance, aiming for a fully localized and efficient user experience.

## Recent Changes (November 12, 2025)
- **ADDED**: Admin edit/delete buttons on every question and answer
  - Edit and delete buttons appear in the top-right corner of all questions and answers when admin is logged in
  - Buttons are only visible to admin users
  - Double confirmation required for deletion (asks twice before deleting)
  - Created `loadAndEditQuestion()` and `loadAndEditAnswer()` methods to fetch data and show edit modals
  - Implemented `bindAdminActions()` method that injects buttons for both SSR and client-rendered content
  - Works seamlessly with existing admin panel functionality

## Previous Changes (November 11, 2025)
- **ADDED**: Email validation function for admin user creation
  - Added `validateEmail()` function to validate email format using regex
  - Prevents invalid email addresses during user creation
- **ADDED**: Auto-generated secure passwords for admin user creation
  - Removed manual password field from "Add User" form
  - Backend generates cryptographically secure 8-character alphanumeric passwords
  - Uses `crypto.getRandomValues()` with rejection sampling to eliminate bias
  - Password shown once to admin via alert after successful creation
  - Admin must save the password immediately as it won't be displayed again
- **IMPROVED**: Change Author modal with username search
  - Replaced browser prompt with in-app modal dialog
  - Real-time username search/filter functionality
  - Shows username, full name, and email for easy identification
  - Fetches all users from database and filters as admin types
  - Click to select user and change authorship instantly
- **IMPORTED**: Bulk user data migration
  - Imported 6,536 users from CSV files (total: 7,270 users in database)
  - Matched user_id with email addresses from separate CSV
  - Converted all usernames to lowercase
  - Skipped existing users (by ID) to avoid duplicates
  - Batch insert for efficient import
- **IMPORTED**: Bulk question/topic data migration  
  - Imported 1,464 questions from topics CSV file
  - Matched user_id with existing users in database
  - Preserved original creation dates from topics
  - Decoded HTML entities in titles and content
  - Skipped 6 questions with invalid user references
- **FIXED**: Pagination scrolling issue
  - Changed from showing all 245 page buttons to smart pagination (max 7 buttons)
  - Now shows: Prev | 1 ... 3 4 5 6 7 ... 245 | Next
  - Added ellipsis styling for better UX
  - Maintains 6 questions per page as designed
- **IMPORTED**: Bulk answer data migration (PARTIAL - IN PROGRESS)
  - CSV contains 8,808 total posts: 2,456 questions + 6,352 answers
  - Successfully imported 4,938 answers (77.7% of total)
  - Matched with 1,116 questions in database
  - Matched user_id with existing users (5,411 valid)
  - Set invalid user_id to NULL for 16 answers
  - Import status: 10/11 batches successful (91% success rate)
  - Remaining: 1,414 answers to import (batch-001 failed + unmatched questions)
  - Answers display correctly with username and date

## User Preferences
None specified yet.

## System Architecture

### Stack
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite-based)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Wrangler CLI
- **Deployment**: Cloudflare Workers

### Key Design Decisions
- **Embedded Frontend**: HTML, CSS, and JS are embedded directly within the Worker code to minimize latency and simplify deployment, operating with no build step.
- **Edge-First**: Optimized for Cloudflare's edge network for global performance.
- **Remote-Only Database**: Uses ONLY remote Cloudflare D1 database; no local database or migration files. All schema changes are applied directly to the remote D1 via the Cloudflare API.
- **Responsive Layout**: Designed for various screen sizes, featuring a full-width header and content widths adjusting from 70% on large screens to 95% on mobile. Mobile UI elements (vote buttons, titles, content text) are sized for improved readability and user experience.
- **UI/UX**: Features a GitHub-style theme with a light background, sharp corners, modal dialogs, and dynamically updated content. Includes a mobile hamburger menu for improved navigation on smaller devices.
- **Internationalization**: A complete translation system with over 250 UI strings supports English and Turkish, with all frontend text dynamically loaded from the database via a `t()` helper function.
- **Authentication & Authorization**: Secure user management (registration, login, logout, password management) with PBKDF2 hashing, secure HttpOnly cookies, and role-based access control (admin/user). User IDs are integer-based.
- **Content Management**: Users can post questions and answers directly, without requiring categories. Admin users have capabilities to create new users and change authorship of questions and answers.
- **Voting System**: Upvote/downvote functionality for questions and answers, with persistent color coding for vote buttons and quality badges.
- **Clean URLs**: Utilizes the History API for human-readable URLs for questions, user profiles, and pagination.
- **Dynamic Site Settings**: Site title and tagline are configurable via an admin panel and loaded dynamically.
- **Server-Side Rendering (SSR)**: Initial page loads are SSR for SEO, with client-side hydration for dynamic interactions.
- **SEO Enhancements**: Implements Google QAPage structured data (JSON-LD) for rich snippets, and generates sitemap files (`/sitemap.xml`, `/q-sitemap.xml`) and `robots.txt` with automatic sitemap regeneration on deployment.
- **Pagination**: Questions are paginated at 6 items per page, accessible via routes like `/`, `/p/1`, etc.

### Project Structure
```
.
├── src/
│   └── index.js
├── wrangler.toml
├── package.json
├── replit.md
└── README.md
```

### Database Schema
- **questions**: `id` (INTEGER), `title`, `content`, `user_id` (INTEGER), `votes`, `created_at`
- **answers**: `id` (INTEGER), `question_id` (INTEGER), `content`, `user_id` (INTEGER), `votes`, `created_at`
- **users**: `id` (INTEGER AUTOINCREMENT), `email`, `username`, `password_hash`, `role`, `name` (TEXT, nullable), `created_at`
- **sessions**: `session_id` (TEXT), `user_id` (INTEGER), `expires_at`, `created_at`
- **votes**: `id` (INTEGER), `user_id` (INTEGER NOT NULL), `item_type`, `item_id`, `vote`, `created_at`, UNIQUE(user_id, item_type, item_id)
- **site_settings**: `key` (TEXT), `value`, `updated_at`
- **translations**: `key` (TEXT), `lang` (TEXT), `value`

## External Dependencies
- **Cloudflare Workers**: Serverless execution environment for hosting the application.
- **Cloudflare D1**: Distributed SQLite database used for all data persistence.
- **Wrangler CLI**: Command-line interface for developing and deploying Cloudflare Workers applications.