import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "./const";
import { NoteSidebar } from "./components/NoteSidebar";
import { TrialBanner } from "./components/TrialBanner";
import Home from "./pages/Home";
import NoteEditor from "./pages/NoteEditor";
import NoteView from "./pages/NoteView";
import Favorites from "./pages/Favorites";
import FolderView from "./pages/FolderView";
import PasswordGenerator from "./pages/PasswordGenerator";
import Users from "./pages/Users";
import License from "./pages/License";
import Settings from "./pages/Settings";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Loader2 } from "lucide-react";
import { trpc } from "./lib/trpc";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/login" });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <NoteSidebar />
      <div className="flex-1 flex flex-col">
        <TrialBanner />
        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <Login />
      </Route>
      
      <Route path="/register">
        <Register />
      </Route>
      
      <Route path="/license">
        <AuthenticatedLayout>
          <License />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/">
        <AuthenticatedLayout>
          <Home />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/note/:id/view">
        <AuthenticatedLayout>
          <NoteView />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/note/:id">
        <AuthenticatedLayout>
          <NoteEditor />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/favorites">
        <AuthenticatedLayout>
          <Favorites />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/folder/:id">
        <AuthenticatedLayout>
          <FolderView />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/password-generator">
        <AuthenticatedLayout>
          <PasswordGenerator />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/users">
        <AuthenticatedLayout>
          <Users />
        </AuthenticatedLayout>
      </Route>
      
      <Route path="/settings">
        <AuthenticatedLayout>
          <Settings />
        </AuthenticatedLayout>
      </Route>
      
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
