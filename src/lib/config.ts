/**
 * Configurație centralizată pentru variabilele de mediu.
 *
 * - Variabilele NEXT_PUBLIC_* sunt accesibile atât pe server cât și în browser.
 * - Variabilele fără prefix NEXT_PUBLIC_ sunt EXCLUSIV server-side.
 *
 * Importă din acest fișier — nu accesa process.env direct în altă parte.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[config] Variabila de mediu lipsă: ${key}\n` +
        `Adaugă-o în fișierul .env.local. Vezi .env.local.example pentru format.`
    );
  }
  return value;
}

// ── Variabile publice (browser + server) ─────────────────────────────────────

export const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// ── Variabile private (EXCLUSIV server-side) ─────────────────────────────────
// Nu importa aceste valori în Client Components sau în cod ce rulează în browser.

export function getServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}
