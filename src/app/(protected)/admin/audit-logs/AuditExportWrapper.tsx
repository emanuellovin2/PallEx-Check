"use client";

import { ExportButton } from "@/components/admin/ExportButton";

interface Props {
  data: Record<string, unknown>[];
}

export function AuditExportWrapper({ data }: Props) {
  return <ExportButton data={data} filename="audit-logs" label="Export" />;
}
