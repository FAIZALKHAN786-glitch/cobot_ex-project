import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MapPin, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportSuccess() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") || "ER-2026-00000";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="relative w-full max-w-md z-10 animate-scale-in">
        <Card className="w-full shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center pb-12 pt-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-200">
                <CheckCircle2 className="h-10 w-10" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">
              Report Submitted
            </CardTitle>
            <p className="text-slate-600 mt-3">
              Your emergency report has been received. Help is on the way.
            </p>
          </CardHeader>
          <CardContent className="space-y-0 pt-0 pb-8">
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Reference Number
              </p>
              <p className="text-2xl font-mono font-bold text-slate-900">
                {ref}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Save this number for status updates.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                asChild
                className="w-full py-4 bg-critical-600 text-white hover:bg-critical-700 glow hover:shadow-critical-400 flex items-center justify-center gap-2"
              >
                <a href="/report">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Report Another Incident
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full py-4 text-sm"
              >
                <a href="/">
                  <MapPin className="h-4 w-4 mr-2" />
                  View Active Map
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
