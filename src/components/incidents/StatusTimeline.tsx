import { type IncidentStatus } from "@/types";
import { Pin, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_ORDER: IncidentStatus[] = [
  "reported",
  "acknowledged",
  "dispatched",
  "on-scene",
  "resolved",
  "closed",
  "cancelled",
];

interface StatusTimelineProps {
  status: IncidentStatus;
  updatedAt: string;
  className?: string;
}

export function StatusTimeline({
  status,
  updatedAt,
  className,
}: StatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className={cn("relative pl-8", className)}>
      <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100" />

      {STATUS_ORDER.map((s, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;
        return (
          <div key={s} className="relative mb-8 last:mb-0">
            {!isCompleted && (
              <div className="absolute left-1 top-4 bottom-[calc(100%-20px)] w-px bg-slate-200" />
            )}
            {isCompleted && (
              <div className="absolute left-1 top-4 bottom-[calc(100%-20px)] w-px bg-resolved-500" />
            )}
            <div className="absolute left-2 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-resolved-600 fill-resolved-600" />
              ) : isActive ? (
                <Pin className="h-4 w-4 text-critical-600" />
              ) : (
                <div className="h-3 w-3 rounded-full bg-slate-300" />
              )}
            </div>
            <div className="ml-9">
              <span className={cn(
                "text-sm font-medium",
                isActive
                  ? "text-critical-700"
                  : isCompleted
                    ? "text-resolved-600"
                    : "text-slate-400"
              )}>
                {s.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </span>
              {i === currentIndex && (
                <span className="ml-2 text-xs text-slate-500">
                  • {new Date(updatedAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
