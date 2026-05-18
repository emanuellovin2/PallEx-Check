# PallEx Check — Deployment Checklist
## Vercel + Supabase

---

## PASUL 1 — Supabase: Baza de date

### 1.1 Rulează schema principală
Mergi la **Supabase Dashboard → SQL Editor → New Query**, lipește conținutul fișierului și apasă **Run**:

```
supabase-schema.sql
```

### 1.2 Rulează migrațiile (în ordine)
Tot în SQL Editor, rulează pe rând:

```
supabase-migration-checklist-v2.sql
supabase-migration-incidents-v2.sql
```

> ⚠️ Rulează-le în ordinea de mai sus. Dacă schema nu e aplicată prima, migrațiile vor eșua.

---

## PASUL 2 — Supabase: Storage

Mergi la **Supabase Dashboard → Storage → New Bucket** și creează:

| Bucket | Tip | Folosit pentru |
|--------|-----|----------------|
| `checklist-photos` | **Private** | Poze checklist și incidente |

> Bucket-ul trebuie să fie **Private** (nu Public).

---

## PASUL 3 — Supabase: Autentificare

Mergi la **Supabase Dashboard → Authentication → Providers**:

- **Email** → activat ✓
- **Confirm email** → dezactivat (șoferii nu au acces la email de firmă)

Mergi la **Authentication → URL Configuration**:

- **Site URL** → adaugă URL-ul Vercel după deploy (ex: `https://pallex-check.vercel.app`)
- **Redirect URLs** → adaugă: `https://pallex-check.vercel.app/auth/callback`

---

## PASUL 4 — Vercel: Deploy

### 4.1 Import proiect
1. Mergi la [vercel.com](https://vercel.com) → **New Project**
2. Importă repo-ul din GitHub (sau drag & drop folderul)
3. Framework: **Next.js** (detectat automat)

### 4.2 Adaugă variabilele de mediu
În pagina de configurare Vercel (înainte de primul deploy), adaugă:

| Variabilă | Valoare | Vizibilitate |
|-----------|---------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://eqbudjlodxcylktmmgsz.supabase.co` | All environments |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | All environments |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | All environments |

> Cheile complete se găsesc în `.env.local` de pe calculatorul tău.

### 4.3 Build settings (lăsă default)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### 4.4 Deploy
Apasă **Deploy** și așteaptă ~2 minute.

---

## PASUL 5 — Post-deploy: Actualizează Supabase

După ce Vercel îți dă URL-ul final (ex: `https://pallex-check.vercel.app`):

1. Mergi la **Supabase → Authentication → URL Configuration**
2. Actualizează **Site URL** cu URL-ul real din Vercel
3. Adaugă în **Redirect URLs**: `https://pallex-check.vercel.app/**`

---

## PASUL 6 — Verificare finală

Bifează fiecare punct după deploy:

- [ ] Pagina de login se încarcă
- [ ] Un cont de admin poate fi creat / logat
- [ ] Un cont de driver poate fi creat / logat
- [ ] Checklist nou poate fi completat și trimis
- [ ] Incident nou poate fi raportat
- [ ] Poze se încarcă în Storage (bucket `photos`)
- [ ] PWA se poate instala pe Android (Chrome → Add to Home Screen)
- [ ] PWA se poate instala pe iOS (Safari → Share → Add to Home Screen)
- [ ] Modul offline funcționează (dezactivează internetul, deschide app-ul)

---

## Rezumat chei necesare

Toate sunt deja în `.env.local` local și trebuie adăugate manual în Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## Creare primul admin

După deploy, primul utilizator admin trebuie setat manual în Supabase:

1. Creează un cont normal prin interfața aplicației
2. Mergi la **Supabase → Table Editor → profiles**
3. Găsește rândul cu email-ul tău
4. Schimbă câmpul `role` din `driver` în `admin`
5. Salvează

De acum, din dashboard-ul de admin poți crea alți utilizatori direct din aplicație.
