export interface DayCount { day: string; count: number; }
export interface NameCount { name: string; count: number; }

export interface ReportSummary {
  deviceTotal: number;
  deviceOnline: number;
  deviceOffline: number;
  deviceInSession: number;
  deviceDisabled: number;
  sessionTotal: number;
  sessionActive: number;
  sessionToday: number;
  sessionsPerDay: DayCount[];
  topTechnicians: NameCount[];
  devicesByBranch: NameCount[];
}
