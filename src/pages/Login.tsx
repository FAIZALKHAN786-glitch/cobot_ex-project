import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="relative w-full max-w-md z-10 animate-scale-in">
        <Card className="w-full shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center pb-12 pt-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-critical-50 text-critical-600 shadow-lg shadow-critical-200">
                <ShieldAlert className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </CardTitle>
            <p className="text-slate-600 mt-3">
              Sign in to access the emergency response platform.
            </p>
          </CardHeader>
          <CardContent className="space-y-0 pt-0 pb-8">
            <LoginForm
              demoEmail="admin@emergency.gov"
              demoPassword="admin123"
              demoLabel="Demo credentials"
              citizenRoute="/report"
            />
          </CardContent>
        </Card>
        <div className="absolute -inset-1 bg-gradient-to-r from-critical-500 to-orange-500 rounded-2xl blur opacity-25 pointer-events-none" />
      </div>
    </div>
  );
}
