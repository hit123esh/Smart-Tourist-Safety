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

## Google Maps Integration

The application includes an interactive safety heat map for visualizing tourist safety zones in Bangalore.

### Features
- **Color-coded markers**: Green (Safe), Yellow (Caution), Red (Unsafe)
- **Heat map layer**: Visual intensity overlay showing risk levels
- **Interactive InfoWindows**: Click markers for location details and safety status
- **Responsive design**: Works on both desktop and mobile

### Configuration

The map configuration is located in `src/config/maps.ts`:

```typescript
// API Key (publishable - security via Google Cloud Console restrictions)
export const GOOGLE_MAPS_API_KEY = 'your-api-key';

// Default center (Bangalore)
export const DEFAULT_MAP_CENTER = { lat: 12.9716, lng: 77.5946 };

// Safety locations array
export const SAFETY_LOCATIONS: SafetyLocation[] = [
  {
    id: 'unique-id',
    name: 'Location Name',
    position: { lat: 12.9507, lng: 77.5848 },
    safetyLevel: 'safe' | 'caution' | 'unsafe',
    description: 'Optional description',
  },
  // ... more locations
];
```

### Adding/Removing Locations

1. Open `src/config/maps.ts`
2. Add new entries to the `SAFETY_LOCATIONS` array
3. Each location requires: `id`, `name`, `position`, and `safetyLevel`
4. The heat map automatically updates based on the locations

### API Key Security

The Google Maps API key is a **publishable key** meant for browser use. Secure it via:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Restrict the key to your domain(s)
3. Limit APIs to Maps JavaScript API only

### Important Note

⚠️ **Demo Data**: Unsafe and caution zones shown are **simulated** for demonstration purposes. 
Real safety data should be integrated from anomaly detection and incident reporting systems.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.
