# PallEx Check — Setup Guide

## Prerequisites
- Node.js 20+
- A free [Supabase](https://supabase.com) account

---

## 1. Install dependencies

```bash
cd "PallEx Check"
npm install
```

---

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon key** from Settings → API

---

## 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 4. Run the database schema

In Supabase Dashboard → SQL Editor, paste and run the contents of `supabase-schema.sql`.

---

## 5. (Optional) Create storage buckets

In Supabase Dashboard → Storage, create one **private** bucket:
- `checklist-photos`

---

## 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 7. Build for production

```bash
npm run build
npm start
```

---

## PWA Installation

### Android
1. Open the app in Chrome
2. Tap the browser menu → "Add to Home screen"
3. The app installs as a native-like PWA

### iOS
1. Open the app in Safari
2. Tap the Share button → "Add to Home Screen"
3. Tap "Add" — the app will appear on your home screen

---

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          — Login page
│   │   └── register/       — Registration page
│   └── (protected)/        — Auth-gated routes
│       ├── dashboard/       — Role-aware home screen
│       ├── checklists/      — Checklist list + new form
│       ├── incidents/       — Incident list + report form
│       ├── drivers/         — Admin: driver management
│       └── settings/        — Profile settings
├── components/
│   ├── ui/                  — Button, Input, Card, Badge, Spinner
│   └── layout/              — BottomNav, Sidebar, TopBar
├── lib/supabase/            — Browser + server Supabase clients
├── middleware.ts            — Auth route protection
└── types/database.ts        — TypeScript DB types
```

---

## Roles

| Feature           | Admin | Driver |
|-------------------|-------|--------|
| View all checklists | ✓   | Own only |
| View all incidents  | ✓   | Own only |
| Manage drivers      | ✓   | ✗ |
| Create checklists   | ✓   | ✓ |
| Report incidents    | ✓   | ✓ |
