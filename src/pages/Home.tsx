import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getIncidents } from "@/services/api";
import { EmergencyMap } from "@/components/incidents/EmergencyMap";
import { MapSearchBar } from "@/components/incidents/MapSearchBar";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { useIncidentStore } from "@/store/useIncidentStore";
import { Button } from "@/components/ui/button";
import { AlertCircle, Filter, MapPin, TrendingUp, ShieldCheck } from "lucide-react";

const CATEGORY_OPTIONS = ["fire", "medical", "flood", "earthquake", "police", "infrastructure", "other"] as const;
const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"] as const;

export default function Home() {
  const { filters, setFilters, clearFilters } = useIncidentStore();
  const [searchLocation, setSearchLocation] = useState<[number, number] | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["incidents", filters],
    queryFn: () => getIncidents(filters),
  });

  const incidents = data?.data || [];

  const handleSearchSelect = useCallback(
    (result: { label: string; lat: number; lng: number }) => {
      setSearchLocation([result.lat, result.lng]);
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-8 w-8 text-slate-400 animate-spin" />
        <p className="mt-2 text-slate-500">Loading emergencies…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Failed to load incidents.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm underline text-critical-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const criticalActive = incidents.filter(
    (inc) =>
      (inc.severity === "critical" || inc.severity === "high") &&
      (inc.status === "reported" ||
        inc.status === "acknowledged" ||
        inc.status === "dispatched" ||
        inc.status === "on-scene")
  ).length;

  const resolvedToday = incidents.filter(
    (inc) =>
      inc.resolvedAt &&
      inc.resolvedAt.startsWith(new Date().toISOString().split("T")[0] ?? "")
  ).length;

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="border-b border-slate-200 pb-6 bg-white/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="animate-enter stagger-0">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-critical-600" />
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Emergency Operations
              </h1>
            </div>
            <p className="text-slate-600 text-sm">
              Real-time incident monitoring and response coordination
            </p>
          </div>
          <div className="flex gap-2 animate-enter stagger-1">
            <Button variant="destructive" asChild className="px-5 py-2.5 text-sm glow">
              <a href="/report">
                <AlertCircle className="h-4 w-4 mr-2" /> Report Emergency
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-enter stagger-2">
        <StatCard
          title="Total Incidents"
          value={incidents.length}
          subtitle="active reports"
          icon={<MapPin className="h-5 w-5 text-slate-600" />}
        />
        <StatCard
          title="Critical / High Active"
          value={criticalActive}
          subtitle={criticalActive > 0 ? "requires attention" : "all clear"}
          icon={
            criticalActive > 0 ? (
              <AlertCircle className="h-5 w-5 text-critical-600" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            )
          }
        />
        <StatCard
          title="Resolved Today"
          value={resolvedToday}
          subtitle="incidents closed"
          icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm animate-enter stagger-3">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Filter:</span>
        </div>
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setFilters({ category: filters.category === cat ? undefined : cat })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 var(--ease-out) ${
              filters.category === cat
                ? "bg-critical-50 text-critical-700 border border-critical-100 shadow-sm"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
        {SEVERITY_OPTIONS.map((sev) => (
          <button
            key={sev}
            onClick={() =>
              setFilters({ severity: filters.severity === sev ? undefined : sev })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 var(--ease-out) ${
              filters.severity === sev
                ? "bg-critical-50 text-critical-700 border border-critical-100 shadow-sm"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
        <button
          onClick={clearFilters}
          className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-100 transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map with search overlay */}
        <div className="lg:col-span-7 relative animate-enter stagger-4">
          <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 max-w-md mx-auto">
            <MapSearchBar
              onSelect={handleSearchSelect}
              className="w-full"
            />
          </div>
          <EmergencyMap
            incidents={incidents}
            center={searchLocation ?? [40.7128, -74.006]}
            centerOn={searchLocation ?? undefined}
            zoom={13}
            height="640px"
          />
        </div>

        {/* List */}
        <div className="lg:col-span-5 animate-enter stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Recent Incidents
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {incidents.length} showing
            </span>
          </div>
          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No incidents match your filters.</p>
              </div>
            ) : (
              incidents.map((incident, idx) => (
                <div
                  key={incident.id}
                  className="stagger-list animate-enter"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <IncidentCard key={incident.id} incident={incident} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
