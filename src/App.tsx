import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";

// Pages
import Home from "@/pages/Home";
import Report from "@/pages/Report";
import ReportSuccess from "@/pages/ReportSuccess";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminIncidentDetail from "@/pages/AdminIncidentDetail";

// Layouts
import { MainLayout } from "@/components/layout/MainLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRouter() {
  useEffect(() => {
    const stored = localStorage.getItem("er-auth-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.user && parsed?.state?.token) {
          useAuthStore.getState().setUser(parsed.state.user);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/report/success" element={<ReportSuccess />} />
            <Route path="/login" element={<Login />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route
              path="/admin/incidents"
              element={<Navigate to="/admin" replace />}
            />
            <Route
              path="/admin/incidents/:id"
              element={<AdminIncidentDetail />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default AppRouter;
