import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Company, Subscription, AuthResponse } from "@shared/schema";

interface AuthContextType {
  user: Omit<User, "password_hash"> | null;
  company: Company | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  login: (response: AuthResponse) => void;
  logout: () => void;
  updateCompany: (company: Company) => void;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password_hash"> | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        setUser(parsed.user);
        setCompany(parsed.company);
        setSubscription(parsed.subscription);
        setToken(parsed.token);
      } catch (e) {
        localStorage.removeItem("auth");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (response: AuthResponse) => {
    setUser(response.user);
    setCompany(response.company);
    setSubscription(response.subscription);
    setToken(response.token);
    localStorage.setItem("auth", JSON.stringify(response));
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    setSubscription(null);
    setToken(null);
    localStorage.removeItem("auth");
  };

  const updateCompany = (updatedCompany: Company) => {
    setCompany(updatedCompany);
    const storedAuth = localStorage.getItem("auth");
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      parsed.company = updatedCompany;
      localStorage.setItem("auth", JSON.stringify(parsed));
    }
  };

  const isAuthenticated = !!user && !!token;
  const hasActiveSubscription = subscription?.status === "trial" || subscription?.status === "active";

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        subscription,
        token,
        isLoading,
        login,
        logout,
        updateCompany,
        isAuthenticated,
        hasActiveSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
