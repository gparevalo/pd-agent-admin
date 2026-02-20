import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppSidebar } from "@/components/AppSidebar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Leads from "@/pages/Leads";
import Conversations from "@/pages/Conversations";
import Agents from "@/pages/Agents";
import AgentDetail from "@/pages/agents/AgentDetail";
import Subscription from "@/pages/Subscription";
import SubscriptionBlocked from "@/pages/SubscriptionBlocked";
import Settings from "@/pages/Settings";
import CatalogPage from "@/pages/CatalogPage";
import AdminCompanies from "@/pages/admin/Companies";
import AdminPlans from "@/pages/admin/Plans";
import AdminDiscounts from "@/pages/admin/Discounts";
import AdminSubscriptions from "@/pages/admin/Subscriptions";
import AdminUsers from "@/pages/admin/Users";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hasActiveSubscription } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!hasActiveSubscription && location !== "/subscription" && location !== "/blocked") {
    return <Redirect to="/blocked" />;
  }

  return <>{children}</>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center gap-2 h-14 px-4 border-b bg-background flex-shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/blocked">
        <ProtectedRoute>
          <SubscriptionBlocked />
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Dashboard />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/leads">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Leads />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/conversations">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Conversations />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/agents">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Agents />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/agents/:id">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AgentDetail />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/catalog">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <CatalogPage />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/subscription">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Subscription />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/profile">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <Settings />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/companies">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AdminCompanies />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/plans">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AdminPlans />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/discounts">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AdminDiscounts />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/subscriptions">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AdminSubscriptions />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute>
          <AuthenticatedLayout>
            <AdminUsers />
          </AuthenticatedLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/">
        <Redirect to="/login" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
