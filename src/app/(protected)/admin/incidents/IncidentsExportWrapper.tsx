"use client";

import { ExportButton } from "@/components/admin/ExportButton";

interface Props {
  data: Record<string, unknown>[];
}

export function IncidentsExportWrapper({ data }: Props) {
  return <ExportButton data={data} filename="incidents" label="Export" />;
}
