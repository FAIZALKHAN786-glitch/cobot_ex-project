"use client";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/components/auth/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import type { User } from "@/types";

interface LoginFormProps {
  demoEmail: string;
  demoPassword: string;
  demoLabel: string;
  adminRoute?: string;
  citizenRoute?: string;
  backLink?: string;
  backLabel?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export function LoginForm({
  demoEmail,
  demoPassword,
  demoLabel,
  adminRoute = "/admin",
  citizenRoute = "/report",
  backLink,
  backLabel,
}: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = location.state?.from?.pathname || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation<{ token: string; user: User }, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (data) => {
      setErrors({});
      useAuthStore.getState().login(data.user, data.token);
      toast({ title: "Signed in", description: `Welcome back, ${data.user.name}` });
      if (data.user.role === "admin") {
        navigate(adminRoute, { replace: true });
      } else {
        navigate(from === "/login" ? (citizenRoute ?? "/report") : from, { replace: true });
      }
    },
    onError: (err: Error) => {
      const message = err.message || "Login failed";
      if (message === "Invalid email or password") {
        setErrors({ email: message, password: message });
      } else {
        setErrors({ submit: message });
      }
      toast({ title: "Login failed", description: message });
    },
  });

  const clearErrors = () => setErrors({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }
    mutation.mutate({ email, password });
  };

  const handleCopyDemo = async () => {
    await navigator.clipboard.writeText(`${demoEmail}\n${demoPassword}`);
    toast({ title: "Copied", description: "Demo credentials copied to clipboard" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-5.33 3.47L6 18M6 18l1.5-7.5M6 18l-1.5-7.5" />
          </svg>
          <Input
            id="email"
            type="email"
            placeholder={demoEmail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) clearErrors();
            }}
            required
            className={cn(
              "pl-10",
              errors.email ? "border-destructive focus:ring-destructive" : ""
            )}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) clearErrors();
            }}
            required
            className={cn(
              "pl-10 pr-10",
              errors.password ? "border-destructive focus:ring-destructive" : ""
            )}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>
      </div>
      {errors.submit && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive-200 bg-destructive-50 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{errors.submit}</span>
        </div>
      )}
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-3 bg-critical-600 text-white hover:bg-critical-700 flex items-center justify-center gap-2 active:scale-95"
      >
        {mutation.isPending ? (
          <>
            <AlertCircle className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            <ArrowRight className="h-4 w-4" />
            Sign in
          </>
        )}
      </Button>
      {backLink && backLabel && (
        <Button
          asChild
          variant="ghost"
          className="w-full py-2 text-sm"
        >
          <a href={backLink}>{backLabel}</a>
        </Button>
      )}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500 text-center mb-3">
          {demoLabel}:
        </p>
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-slate-700">{demoEmail}</span>
            <span className="font-mono text-slate-700">{demoPassword}</span>
          </div>
          <button
            onClick={handleCopyDemo}
            className="text-slate-400 hover:text-critical-600 transition-colors"
            aria-label="Copy credentials"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
