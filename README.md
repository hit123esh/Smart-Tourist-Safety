# Smart Tourism Safety System

## ⚠️ Authentication Notice

**This project uses a simplified authentication flow for development purposes.**

### Current Authentication:
- **Tourist Sign-up/Sign-in**: Email-only lookup (no password required for tourists)
- **Police Portal**: Uses Supabase Auth with password authentication

### What this means:
- Tourist authentication checks if the email exists in the `tourists` table
- No email verification is performed
- Session state is managed client-side for tourists
- This is **NOT production-grade authentication**

### To enable proper authentication later:
1. Re-enable Supabase Auth email/password for tourists
2. Add email verification flow
3. Implement proper session management with JWTs
4. Add password reset functionality

---

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (PostgreSQL + Auth for police only)

## Database Schema

The `tourists` table now stores user data directly without requiring Supabase Auth for tourist users:

```sql
-- Tourists table (no user_id foreign key for simplified auth)
CREATE TABLE public.tourists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  emergency_contact TEXT,
  status TEXT DEFAULT 'safe',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tourists ENABLE ROW LEVEL SECURITY;

-- Allow public insert for registration
CREATE POLICY "Anyone can register"
  ON public.tourists FOR INSERT
  WITH CHECK (true);

-- Allow public select for login check
CREATE POLICY "Anyone can check email"
  ON public.tourists FOR SELECT
  USING (true);
```

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.
