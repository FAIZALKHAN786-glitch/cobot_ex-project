import { useQuery } from "@tanstack/react-query";
import { getStats, getIncidents } from "@/services/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { IncidentTableRow } from "@/components/incidents/IncidentTableRow";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LayoutDashboard, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
    refetchInterval: 30000,
  });
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ["incidents-admin"],
    queryFn: () => getIncidents(),
  });

  const incidents = incidentsData?.data || [];

  if (statsLoading || incidentsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="h-8 w-8 text-slate-400 animate-spin" />
        <p className="mt-2 text-slate-500">Loading dashboard…</p>
      </div>
    );
  }

  const s = stats ?? {
    total: 0,
    criticalActive: 0,
    resolvedToday: 0,
    averageResponseTimeMinutes: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">
          Monitor and manage all emergency incidents.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Incidents"
          value={s.total}
          icon={<LayoutDashboard className="h-5 w-5" />}
        />
        <StatCard
          title="Critical / High Active"
          value={s.criticalActive}
          icon={<AlertTriangle className="h-5 w-5 text-critical-600" />}
        />
        <StatCard
          title="Resolved Today"
          value={s.resolvedToday}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        />
        <StatCard
          title="Avg. Response Time"
          value={`${s.averageResponseTimeMinutes} min`}
          subtitle="median"
          icon={<Clock className="h-5 w-5 text-blue-600" />}
        />
      </div>

      {/* Incident table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No incidents found.
                  </td>
                </tr>
              ) : (
                incidents.map((inc: { id: string }) => (
                  <IncidentTableRow key={inc.id} incident={inc as never} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const AdminDashboardProtected = () => (
  <ProtectedRoute roles={["admin"]}>
    <AdminDashboard />
  </ProtectedRoute>
);
