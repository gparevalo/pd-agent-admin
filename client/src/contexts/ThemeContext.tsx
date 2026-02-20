import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { CompanyTheme } from "@shared/schema";
import logo from "@assets/img/logo.jpg";
interface ThemeContextType {
  theme: CompanyTheme;
  applyTheme: (theme: CompanyTheme) => void;
}

const defaultTheme: CompanyTheme = {
  company_name: "PD Agencia",
  primary_color: "#EF0034",
  secondary_color: "#1B1B1B",
  logo_url: logo,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "347 100% 47%";

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { company } = useAuth();

  const theme: CompanyTheme = company
    ? {
        company_name: company.name,
        primary_color: defaultTheme.primary_color,
        secondary_color: defaultTheme.secondary_color,
        logo_url: company.logo_url,
      }
    : defaultTheme;

  const applyTheme = (newTheme: CompanyTheme) => {
    const root = document.documentElement;
    const primaryHSL = hexToHSL(newTheme.primary_color);

    root.style.setProperty("--primary", primaryHSL);
    root.style.setProperty("--sidebar-primary", primaryHSL);
    root.style.setProperty("--ring", primaryHSL);
    root.style.setProperty("--sidebar-ring", primaryHSL);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme.primary_color, theme.secondary_color]);

  return (
    <ThemeContext.Provider value={{ theme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
