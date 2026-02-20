import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Bot,
  Building2,
  CreditCard,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  Tag,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
}

const superadminMenu: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Empresas", url: "/admin/companies", icon: Building2 },
  { title: "Planes", url: "/admin/plans", icon: FileText },
  { title: "Suscripciones", url: "/admin/subscriptions", icon: CreditCard },
  { title: "Descuentos", url: "/admin/discounts", icon: Tag },
  { title: "Usuarios", url: "/admin/users", icon: Users },
];

const companyAdminMenu: MenuItem[] = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Agentes", url: "/agents", icon: Bot },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Bandeja de entrada", url: "/conversations", icon: MessageSquare },
  { title: "Catálogo", url: "/catalog", icon: Package },
  { title: "Membresía", url: "/subscription", icon: CreditCard },
  { title: "Configuración", url: "/settings", icon: Settings },
];

const clientAdminMenu: MenuItem[] = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Bandeja de entrada", url: "/conversations", icon: MessageSquare },
  { title: "Configuración", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, company, logout } = useAuth();
  const { theme } = useTheme();

  const getMenuItems = (): MenuItem[] => {
    switch (user?.role) {
      case "superadmin":
        return superadminMenu;
      case "company_admin":
        return companyAdminMenu;
      case "client_admin":
        return clientAdminMenu;
      default:
        return companyAdminMenu;
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {theme.logo_url ? (
            <img
              src={theme.logo_url}
              alt={theme.company_name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primary_color }}
            >
              <span className="text-lg font-bold text-white">
                {theme.company_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{theme.company_name}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
