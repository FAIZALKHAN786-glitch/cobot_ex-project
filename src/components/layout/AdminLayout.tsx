import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, LayoutDashboard, FileText, ShieldAlert, MapPin, Logs, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmergencyAlertBanner } from "../dashboard/EmergencyAlertBanner";

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/admin", label: "Incidents", icon: <FileText className="h-5 w-5" /> },
    { href: "/admin", label: "Map", icon: <MapPin className="h-5 w-5" /> },
    { href: "/admin", label: "Status Logs", icon: <Logs className="h-5 w-5" /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-critical-600" />
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Emergency<span className="text-critical-600">Ops</span> Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-8 text-sm">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    location.pathname === link.href
                      ? "text-critical-600 font-semibold"
                      : "text-slate-600 hover:text-critical-600"
                  )}
                >
                  {link.icon} <span>{link.label}</span>
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{user?.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="h-9 px-3"
              >
                <LogOut className="h-3 w-3 mr-1" /> Sign out
              </Button>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:text-critical-600 transition-colors rounded-lg hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform -translate-x-full transition-transform duration-300 var(--ease-drawer) md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex h-full flex-col">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Navigation
              </h2>
            </div>
            <nav className="flex-1 space-y-1 p-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                    location.pathname === link.href
                      ? "bg-critical-50 text-critical-600 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-critical-600"
                  )}
                >
                  {link.icon} {link.label}
                </a>
              ))}
            </nav>
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/50 rounded-xl"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </aside>

        {isOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur md:hidden" onClick={() => setIsOpen(false)} />
        )}

        <main className="flex-1 p-8 md:pl-0">
          <EmergencyAlertBanner />
          <div className="space-y-6">{<Outlet />}</div>
        </main>
      </div>
    </div>
  );
}
