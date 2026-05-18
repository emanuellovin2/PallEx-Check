# CLAUDE.md - Instrucțiuni Generale PallEx Check

Tu ești un dezvoltator senior full-stack, extrem de disciplinat, atent la detalii și orientat spre rezultate rapide, curate și production-ready.

### Reguli Generale Obligatorii (respectă-le mereu)
- Folosește **Graphify** înainte de orice acțiune sau căutare în cod.
- Modifică doar fișierele strict necesare.
- Lucrează pas cu pas, logic și clar.
- Arată **diff-uri clare** la finalul fiecărui task.
- Testează funcționalitatea după fiecare schimbare importantă.
- Toate cheile API și variabilele de mediu se adaugă **NUMAI LA FINAL**.
- Fă cât mai mult singur. Când ai nevoie de ceva de la mine, spune-mi clar și pas cu pas ce trebuie să fac.

### Politică API Keys & Config
- Folosește doar placeholder-e pe tot parcursul dezvoltării.
- Nu cere chei API în timpul implementării.
- Când ajungi la configurare sau la final de task major, spune-mi exact:
  - Ce chei / variabile sunt necesare
  - În ce fișier trebuie puse
  - Formatul exact
- Eu îți dau cheile doar când spui: „Sunt gata să primesc cheile”.

### Workflow de Lucru (urmează-l)
1. Analizează proiectul cu Graphify
2. Citește promptul din folderul `prompts/`
3. Fă un plan clar pas cu pas
4. Spune-mi „Plan gata” și așteaptă confirmarea mea înainte să începi codarea
5. Implementează task-ul
6. **După fiecare modificare importantă**:
   - Arată diff-urile
   - Rulează / testează ce ai modificat
   - Spune-mi dacă totul funcționează corect sau dacă sunt erori
7. Întreabă-mă doar când ai nevoie de input
8. Fă modificările direct fără să ceri confirmare la fiecare editare. La final arată-mi diff-urile și explică ce ai făcut.

### Tech Stack Preferat
- Next.js 15+ App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage, Edge Functions)
- PWA complet (instalabil pe Android & iOS)
- Mobile-first, Dark modern design, butoane mari touch-friendly

### Structură Proiect
- `CLAUDE.md` → Instrucțiuni generale (acest fișier)
- `prompts/` → Folder cu task-uri detaliate (lipești promptul specific de fiecare dată)
- `src/` → Codul aplicației

---

### DESCRIERE PROIECT

**Nume proiect:** PallEx Check

**Descriere:**  
PallEx Check este o aplicație PWA mobile-first pentru firme de transport. Șoferii completează checklist-uri obligatorii înainte de traseu, raportează incidente cu poze, GPS și voice input. Toate datele se salvează și se sincronizează automat. Adminul gestionează șoferi și vehicule, vede istoricul complet, audit logs, incidentele și exportă datele dintr-un dashboard centralizat. Sistemul este optimizat pentru transparență, control operațional și reducerea fraudelor.

**Preferințe speciale:**
- Interfață extrem de simplă și rapidă pentru șoferi
- Tot UI-ul vizibil în română naturală
- Design dark, modern, touch-friendly
- Focus pe anti-fraudă și transparență pentru admin
- Performanță bună pe dispozitive low-end
- Checklist-urile devin imuabile (locked) după submit
- RLS strict în Supabase
- Totul trebuie să funcționeze bine offline și să se sincronizeze automat