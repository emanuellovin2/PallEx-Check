"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search, X, Filter } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface AdminFilterBarProps {
  drivers?: FilterOption[];
  vehicles?: FilterOption[];
  showStatus?: boolean;
  showSeverity?: boolean;
  showFraud?: boolean;
  showSearch?: boolean;
  statusOptions?: FilterOption[];
}

export function AdminFilterBar({
  drivers = [],
  vehicles = [],
  showStatus = false,
  showSeverity = false,
  showFraud = false,
  showSearch = false,
  statusOptions = [],
}: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters = Array.from(searchParams.entries()).some(
    ([k]) => !["page"].includes(k)
  );

  const currentDriver = searchParams.get("driver") ?? "";
  const currentVehicle = searchParams.get("vehicle") ?? "";
  const currentDate = searchParams.get("date") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentSeverity = searchParams.get("severity") ?? "";
  const currentFraud = searchParams.get("fraud") ?? "";
  const currentSearch = searchParams.get("q") ?? "";

  return (
    <div className="flex flex-col gap-2">
      {/* Search bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            defaultValue={currentSearch}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParam("q", (e.target as HTMLInputElement).value);
              }
            }}
            onChange={(e) => {
              if (!e.target.value) updateParam("q", "");
            }}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-surface-800 border border-surface-700
              text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2
              focus:ring-brand-500 focus:border-transparent hover:border-surface-600 transition-colors"
          />
        </div>
      )}

      {/* Filter row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />

        {/* Driver filter */}
        {drivers.length > 0 && (
          <select
            value={currentDriver}
            onChange={(e) => updateParam("driver", e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              hover:border-surface-600 transition-colors cursor-pointer flex-shrink-0 min-w-[130px]"
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        )}

        {/* Vehicle filter */}
        {vehicles.length > 0 && (
          <select
            value={currentVehicle}
            onChange={(e) => updateParam("vehicle", e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              hover:border-surface-600 transition-colors cursor-pointer flex-shrink-0 min-w-[130px]"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        )}

        {/* Status filter */}
        {showStatus && (
          <select
            value={currentStatus}
            onChange={(e) => updateParam("status", e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              hover:border-surface-600 transition-colors cursor-pointer flex-shrink-0 min-w-[120px]"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        {/* Severity filter */}
        {showSeverity && (
          <select
            value={currentSeverity}
            onChange={(e) => updateParam("severity", e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              hover:border-surface-600 transition-colors cursor-pointer flex-shrink-0 min-w-[120px]"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        )}

        {/* Fraud filter */}
        {showFraud && (
          <select
            value={currentFraud}
            onChange={(e) => updateParam("fraud", e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-sm text-white
              focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
              hover:border-surface-600 transition-colors cursor-pointer flex-shrink-0 min-w-[150px]"
          >
            <option value="">All Signals</option>
            <option value="missing_photos">Missing Photos</option>
            <option value="late_submissions">Late Submissions</option>
            <option value="gps_missing">GPS Missing</option>
          </select>
        )}

        {/* Date filter */}
        <input
          type="date"
          value={currentDate}
          onChange={(e) => updateParam("date", e.target.value)}
          className="h-9 px-3 rounded-lg bg-surface-800 border border-surface-700 text-sm text-white
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
            hover:border-surface-600 transition-colors cursor-pointer flex-shrink-0
            [color-scheme:dark]"
        />

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 h-9 px-3 rounded-lg bg-surface-700 hover:bg-surface-600
              text-slate-400 hover:text-white text-sm transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
