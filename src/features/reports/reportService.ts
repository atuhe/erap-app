import { apiFetch } from "../../lib/apiClient";
import type { ReportSummary } from "./report.types";

export function getReportSummary(): Promise<ReportSummary> {
  return apiFetch<ReportSummary>("/api/reports/summary");
}
