"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
        <svg
          className="h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 18M8.111 8.111A3 3 0 0012 7a3 3 0 013 3 3 3 0 01-.111.889M6.343 6.343A8 8 0 0012 4a8 8 0 018 8 8 8 0 01-1.657 4.9M12 20a8 8 0 01-8-8"
          />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-white">Fără conexiune</h1>
      <p className="max-w-xs text-sm text-slate-400">
        Nu există conexiune la internet. Datele completate offline se vor sincroniza automat când revii online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white active:bg-blue-700"
      >
        Reîncearcă
      </button>
    </div>
  );
}
