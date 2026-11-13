import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden">
      <CardContent className="pt-6 pb-6 pr-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {title}
            </p>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-3xl font-bold text-slate-900">{value}</span>
              {subtitle && (
                <span className="text-sm text-slate-400">{subtitle}</span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/50 group-hover:bg-slate-100 transition-colors">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
