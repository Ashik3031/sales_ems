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
        <RequireAuth roles={['admin', 'tl']}>
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
        <GlobalCelebration />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

import CelebrationPopup from "@/components/CelebrationPopup";
import { useState, useRef } from "react";

function GlobalCelebration() {
  const [celebrationData, setCelebrationData] = useState<any | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const lastCelebrationRef = useRef<string>("");

  useEffect(() => {
    const handleCelebration = (event: CustomEvent<any>) => {
      console.log('[GlobalCelebration] Received event:', event.detail);
      const newData = event.detail;
      // Include timestamp in the unique key to allow same-count celebrations (e.g. if persistence fails or manual triggers)
      const uniqueKey = `${newData.agentId}-${newData.newActivationCount}-${newData.timestamp}`;

      if (lastCelebrationRef.current === uniqueKey) {
        console.log('[GlobalCelebration] Ignoring duplicate');
        return;
      }

      lastCelebrationRef.current = uniqueKey;
      setCelebrationData(newData);
      setShowCelebration(true);
    };

    window.addEventListener('show-celebration', handleCelebration as EventListener);
    return () => window.removeEventListener('show-celebration', handleCelebration as EventListener);
  }, []);

  return (
    <CelebrationPopup
      isVisible={showCelebration}
      data={celebrationData}
      onClose={() => setShowCelebration(false)}
    />
  );
}

export default App;
