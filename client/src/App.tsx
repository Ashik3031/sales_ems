import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/store/authStore";
import { socketManager } from "@/lib/socket";
import Navigation from "@/components/Navigation";
import NotificationTakeover from "@/components/NotificationTakeover";
import Leaderboard from "@/pages/Leaderboard";
import TLDashboard from "@/pages/TLDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminTeams from "@/pages/AdminTeams";
import Login from "@/pages/Login";
import TLLogin from "@/pages/TLLogin";
import ConferenceBooking from "@/pages/ConferenceBooking";
import EmployeeRegister from "@/pages/EmployeeRegister";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import EmployeePerformance from "@/pages/EmployeePerformance";
import NotFound from "@/pages/not-found";

// Auth guard component
function RequireAuth({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  if (roles.length > 0 && !roles.includes(user?.role || '')) {
    return <NotFound />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <RequireAuth roles={['admin','tl']}>
          <Leaderboard />
        </RequireAuth>
      </Route>
      <Route path="/login" component={Login} />
      <Route path="/tl-login" component={TLLogin} />

      {/* Protected routes - always declared */}
      <Route path="/tl">
        <RequireAuth roles={['admin', 'tl']}>
          <TLDashboard />
        </RequireAuth>
      </Route>

      <Route path="/admin">
        <RequireAuth roles={['admin']}>
          <AdminDashboard />
        </RequireAuth>
      </Route>

      <Route path="/admin/teams">
        <RequireAuth roles={['admin']}>
          <AdminTeams />
        </RequireAuth>
      </Route>

      <Route path="/conference">
        <RequireAuth roles={['admin', 'tl']}>
          <ConferenceBooking />
        </RequireAuth>
      </Route>

      <Route path="/employee-register" component={EmployeeRegister} />

      <Route path="/employee-dashboard">
        <RequireAuth roles={['employee']}>
          <EmployeeDashboard />
        </RequireAuth>
      </Route>

      <Route path="/performance/:agentId">
        <RequireAuth roles={['admin', 'tl']}>
          <EmployeePerformance />
        </RequireAuth>
      </Route>

      <Route path="/performance">
        <RequireAuth roles={['employee']}>
          <EmployeePerformance />
        </RequireAuth>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch >
  );
}

function App() {
  useEffect(() => {
    // Initialize WebSocket connection
    socketManager.connect();

    return () => {
      // Cleanup on app unmount
      socketManager.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main>
          <Router />
        </main>
        <NotificationTakeover />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
