import { useQuery } from "@tanstack/react-query";
import { getIncidents } from "@/services/api";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/auth/use-toast";

interface EmergencyAlertBannerProps {
  className?: string;
}

export function EmergencyAlertBanner({ className }: EmergencyAlertBannerProps) {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => getIncidents(),
    refetchInterval: 30000,
  });

  const criticalHigh = (data?.data || []).filter(
    (inc) =>
      (inc.severity === "critical" || inc.severity === "high") &&
      (inc.status === "reported" ||
        inc.status === "acknowledged" ||
        inc.status === "dispatched" ||
        inc.status === "on-scene")
  );

  if (isLoading || error || criticalHigh.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[60] bg-critical-50 border-b border-critical-200 px-4 py-3",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-critical-600" aria-hidden="true" />
        <div className="flex-1">
          <h3 className="font-semibold text-critical-800">
            Active Critical / High Incidents
          </h3>
          <p className="text-sm text-critical-700">
            {criticalHigh.length} incident{s(criticalHigh.length)} requiring attention
          </p>
        </div>
        <button
          onClick={() =>
            toast({
              description: `Viewing ${criticalHigh.length} active critical/high incident(s).`,
            })
          }
          className="ml-3 inline-flex items-center justify-center rounded-md p-1.5 text-critical-600 hover:bg-critical-100"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function s(count: number): string {
  return count === 1 ? "" : "s";
}
