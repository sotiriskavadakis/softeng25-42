import { Link, useLocation } from "react-router-dom";
import { Map, User, BarChart3, Settings, LogOut, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useUserRole";

const navItems = [
  { to: "/", icon: Map, label: "Find Chargers" },
  { to: "/stats", icon: BarChart3, label: "My Stats" },
  { to: "/profile", icon: User, label: "Profile" },
];

const adminNavItems = [
  { to: "/admin/network", icon: Shield, label: "Network Dashboard" },
];

export function Sidebar() {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/map" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-glow">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-gradient">EMPower</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
                Admin
              </p>
            </div>
            {adminNavItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Settings</span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
