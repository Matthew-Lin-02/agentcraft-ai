# AgentCraft AI

An AI-powered property listing and marketing campaign studio built for real estate workflows (tailored with inner-north Melbourne / Nelson Alexander demo presets). It generates multi-channel listing copy—REA/Domain descriptions, social posts, and buyer outreach emails—and persists saved campaigns per user in Supabase Postgres with Google OAuth authentication.

## What It Does

- **Multi-Channel Copy Generation (`src/App.tsx`)**: Takes property attributes (address, suburb, property type, bedrooms, bathrooms, car spaces, feature tags, target persona, tone, and agent notes) and generates structured output across **REA / Domain**, **Social** (Instagram & Facebook), **Buyer Email**, and **JSON** views, with one-click clipboard copy and sample property presets (Fitzroy, Carlton, Northcote).
- **Google OAuth & Per-User Persistence**: Uses Supabase Auth (`signInWithOAuth` with `google`) and stores generated listings in the `listings` table scoped to each authenticated user (`user_id` / `auth.uid()` via Row-Level Security).
- **Saved Listings Library**: Search, filter by suburb or buyer persona, inspect full generated campaigns in a modal, and delete listings from Supabase Postgres.
- **Architecture Overview Tab**: Summarizes structured AI outputs, per-user Postgres/RLS data isolation, and future integration paths (CRM webhooks, MCP tools, and enterprise SSO).

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS (`@tailwindcss/vite`), Lucide Icons
- **Backend / Database / Auth**: Supabase (Postgres + Google OAuth)
- **Deployment**: Vercel

## Prerequisites

- Node.js (v18+ recommended) and `npm`
- A **Supabase** project with:
  - A `listings` table and Row-Level Security (RLS) policies scoping rows by `user_id` (`auth.uid()`)
  - **Google** provider enabled under **Authentication → Sign In / Providers**
- A **Google Cloud Console** OAuth 2.0 Client ID with:
  - **Authorized redirect URIs**: `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
  - **Authorized JavaScript origins**: your local dev URL (e.g., `http://localhost:5174`) and your production Vercel URL

## Local Setup & Running the App

1. **Install dependencies**
   ```bash
   npm install