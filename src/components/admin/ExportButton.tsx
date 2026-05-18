"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  label?: string;
  /** Optional human-readable title shown in the PDF header */
  pdfTitle?: string;
}

export function ExportButton({
  data,
  filename = "export",
  label = "Export CSV",
  pdfTitle,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function downloadCSV() {
    if (!data.length) return;
    setLoading(true);

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          if (str.includes(",") || str.includes("\n") || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
    setOpen(false);
  }

  function downloadJSON() {
    setLoading(true);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
    setOpen(false);
  }

  function printPDF() {
    if (!data.length) return;
    setLoading(true);

    const headers = Object.keys(data[0]);
    const title = pdfTitle ?? filename.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const dateStr = new Date().toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const headerCells = headers
      .map((h) => `<th>${h.replace(/_/g, " ")}</th>`)
      .join("");

    const bodyRows = data
      .map((row) => {
        const cells = headers
          .map((h) => {
            const val = row[h];
            const str = val === null || val === undefined ? "—" : String(val);
            return `<td>${str}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
    .header h1 { font-size: 18px; font-weight: 700; color: #1a56db; }
    .header .meta { font-size: 10px; color: #666; text-align: right; }
    .meta .count { font-weight: 600; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; }
    th { background: #1a56db; color: #fff; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; word-break: break-word; max-width: 200px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 16px; font-size: 9px; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      @page { margin: 15mm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PallEx Check — ${title}</h1>
    <div class="meta">
      <div>${dateStr}</div>
      <div>Total: <span class="count">${data.length} înregistrări</span></div>
    </div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">PallEx Check · Export generat automat · ${dateStr}</div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setLoading(false);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!data.length || loading}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface-800 border border-surface-700
          hover:bg-surface-700 text-slate-300 hover:text-white text-sm font-medium
          transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {label}
        {data.length > 0 && (
          <span className="bg-surface-600 text-slate-400 text-xs rounded-full px-1.5 py-0.5 leading-none">
            {data.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface-800 border border-surface-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300
                hover:bg-surface-700 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Download CSV
            </button>
            <button
              onClick={downloadJSON}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300
                hover:bg-surface-700 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-brand-400" />
              Download JSON
            </button>
            <button
              onClick={printPDF}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-300
                hover:bg-surface-700 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-red-400" />
              Print / PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
