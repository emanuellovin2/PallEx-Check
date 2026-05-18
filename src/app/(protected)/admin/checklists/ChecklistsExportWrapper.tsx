"use client";

import { ExportButton } from "@/components/admin/ExportButton";

interface Props {
  data: Record<string, unknown>[];
}

export function ChecklistsExportWrapper({ data }: Props) {
  return <ExportButton data={data} filename="checklists" label="Export" />;
}
