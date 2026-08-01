import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Cell,
} from "recharts";
import { MonitorSmartphone, Radio, Activity, CalendarClock } from "lucide-react";
import { getReportSummary } from "@/features/reports/reportService";
import type { ReportSummary } from "@/features/reports/report.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="text-xs text-muted-foreground">{label}{sub ? ` · ${sub}` : ""}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsModule() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReportSummary().then(setData).catch((e) => setError(e?.message ?? "Failed to load reports"));
  }, []);

  if (error) return <div className="p-6 text-sm text-destructive">{error}</div>;
  if (!data) return <div className="p-6 text-sm text-muted-foreground">Loading reports…</div>;

  const statusData = [
    { name: "Online", count: data.deviceOnline },
    { name: "In Session", count: data.deviceInSession },
    { name: "Offline", count: data.deviceOffline },
    { name: "Disabled", count: data.deviceDisabled },
  ];
  const statusColors = ["#16a34a", "#2563eb", "#dc2626", "#6b7280"];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={MonitorSmartphone} label="Managed devices" value={data.deviceTotal} sub={`${data.deviceOnline} online`} />
        <Kpi icon={Activity} label="Active sessions" value={data.sessionActive} />
        <Kpi icon={CalendarClock} label="Sessions today" value={data.sessionToday} />
        <Kpi icon={Radio} label="Total sessions" value={data.sessionTotal} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Sessions — last 7 days</CardTitle></CardHeader>
          <CardContent className="h-64">
            {data.sessionsPerDay.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">No sessions in the last 7 days.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sessionsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" fontSize={11} tickFormatter={(d) => String(d).slice(5)} />
                  <YAxis allowDecimals={false} fontSize={11} width={28} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Devices by status</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                <RTooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusData.map((_, i) => <Cell key={i} fill={statusColors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Most active technicians</CardTitle></CardHeader>
          <CardContent className="h-64">
            {data.topTechnicians.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">No session activity yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topTechnicians} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={90} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Devices by branch</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.devicesByBranch} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" fontSize={11} width={90} />
                <RTooltip />
                <Bar dataKey="count" fill="#0891b2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
