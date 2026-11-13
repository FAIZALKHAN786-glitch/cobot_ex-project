import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { Menu, X, User, LogOut, Smartphone, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: <MapPin className="h-4 w-4" /> },
    { href: "/report", label: "Report Emergency", icon: <Smartphone className="h-4 w-4" /> },
    { href: "/login", label: "Login", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-critical-600 flex items-center justify-center text-white font-bold shadow-lg shadow-critical-200">
              ER
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Emergency<span className="text-critical-600">Response</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "text-critical-600"
                    : "text-slate-600 hover:text-critical-600"
                )}
              >
                {link.icon} <span>{link.label}</span>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-600">{user.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="h-9 px-3"
                >
                  <LogOut className="h-3 w-3 mr-1" /> Sign out
                </Button>
              </div>
            ) : (
              <Button asChild>
                <a href="/login" className="px-4">
                  Sign in
                </a>
              </Button>
            )}
            <Button
              variant="destructive"
              asChild
              size="sm"
              className="hidden md:flex h-9 px-4 glow"
            >
              <a href="/report">
                <AlertCircle className="h-3 w-3 mr-2" /> Report Emergency
              </a>
            </Button>

            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:text-critical-600 transition-colors rounded-lg hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}
      {isOpen && (
        <aside className="fixed top-0 left-0 z-[51] h-full w-80 bg-white border-r border-slate-200 shadow-2xl transform transition-transform duration-300 var(--ease-drawer)">
          <div className="p-6 flex justify-between items-center border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-6 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-critical-50 text-critical-600"
                    : "text-slate-600 hover:bg-slate-100 hover:text-critical-600"
                )}
              >
                {link.icon} {link.label}
              </a>
            ))}
            <hr className="my-6 border-slate-100" />
            <div className="px-3 py-2 text-sm text-slate-600">
              {user ? (
                <>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.role}</p>
                </>
              ) : (
                <p>Not signed in</p>
              )}
            </div>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-destructive hover:bg-destructive/50 rounded-xl"
            >
              Sign out
            </button>
          </nav>
        </aside>
      )}

      <main className="pt-8 px-4">{<Outlet />}</main>
    </div>
  );
}
