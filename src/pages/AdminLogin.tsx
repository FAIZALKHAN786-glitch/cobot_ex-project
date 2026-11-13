import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-critical-900/10 via-slate-50 to-blue-50/10 px-4">
      <div className="relative w-full max-w-md z-10 animate-scale-in">
        <Card className="w-full shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center pb-12 pt-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-200">
                <ShieldAlert className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">
              Administrator Sign-In
            </CardTitle>
            <p className="text-slate-600 mt-3">
              Authorized personnel only. Emergency operations access.
            </p>
          </CardHeader>
          <CardContent className="space-y-0 pt-0 pb-8">
            <LoginForm
              demoEmail="admin"
              demoPassword="admin123"
              demoLabel="Demo credentials"
              adminRoute="/admin"
              backLink="/"
              backLabel="← Return to operations"
            />
          </CardContent>
        </Card>
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl blur opacity-20 pointer-events-none" />
      </div>
    </div>
  );
}
