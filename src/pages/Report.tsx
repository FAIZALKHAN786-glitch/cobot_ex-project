import { ReportForm } from "@/components/incidents/ReportForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Report() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 mb-8">
        <Button asChild variant="outline" size="sm" className="px-4">
          <a href="/">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to map
          </a>
        </Button>
        <div className="flex-1 border-t border-slate-200" />
      </div>
      <Card className="animate-enter">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
            <Smartphone className="h-5 w-5 mr-2 text-critical-600" />
            Report Emergency
          </CardTitle>
          <p className="text-slate-600">
            Help us respond quickly. Provide as much detail as you can about
            the incident.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <ReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
